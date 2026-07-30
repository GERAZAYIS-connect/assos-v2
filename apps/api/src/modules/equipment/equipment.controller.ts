import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AssociationRoleGuard } from '../../common/guards/association-role.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('equipment')
@Controller({ path: 'associations/:assocId/equipment', version: '1' })
@UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
@ApiBearerAuth()
export class EquipmentController {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveAssociationId(idOrSlug: string): Promise<string> {
    const assoc = await this.prisma.association.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });
    if (!assoc) {
      throw new NotFoundException(`Association '${idOrSlug}' introuvable.`);
    }
    return assoc.id;
  }

  @Get()
  @Roles()
  @ApiOperation({ summary: 'Get all equipment for an association' })
  async getEquipment(@Param('assocId') assocId: string) {
    const targetId = await this.resolveAssociationId(assocId);
    const items = await this.prisma.equipment.findMany({
      where: { associationId: targetId },
      include: { rentals: true },
      orderBy: { createdAt: 'desc' },
    });
    return items;
  }

  @Post()
  @Roles('SECRETARY')
  @ApiOperation({ summary: 'Add a new equipment item' })
  async createEquipment(
    @Param('assocId') assocId: string,
    @Body()
    body: {
      name: string;
      category?: string;
      quantity: number;
      condition?: any;
      purchaseValue?: number;
      rentalRateDay?: number;
      notes?: string;
    },
  ) {
    const targetId = await this.resolveAssociationId(assocId);
    const qty = Number(body.quantity) || 1;

    const item = await this.prisma.equipment.create({
      data: {
        associationId: targetId,
        name: body.name,
        category: body.category || 'RÉCEPTION',
        quantity: qty,
        availableQty: qty,
        condition: body.condition || 'GOOD',
        purchaseValue: Number(body.purchaseValue) || 0,
        rentalRateDay: Number(body.rentalRateDay) || 0,
        notes: body.notes,
      },
    });
    return item;
  }

  @Get('rentals')
  @Roles()
  @ApiOperation({ summary: 'Get all equipment rentals' })
  async getRentals(@Param('assocId') assocId: string) {
    const targetId = await this.resolveAssociationId(assocId);
    const rentals = await this.prisma.equipmentRental.findMany({
      where: { associationId: targetId },
      include: { equipment: true },
      orderBy: { createdAt: 'desc' },
    });
    return rentals;
  }

  @Post('rentals')
  @Roles('SECRETARY')
  @ApiOperation({ summary: 'Create an equipment rental reservation' })
  async createRental(
    @Param('assocId') assocId: string,
    @Body()
    body: {
      equipmentId: string;
      renterName: string;
      renterPhone?: string;
      quantity: number;
      startDate: string;
      endDate: string;
      totalAmount: number;
      advancePaid?: number;
      notes?: string;
    },
  ) {
    const targetId = await this.resolveAssociationId(assocId);
    const advancePaid = Number(body.advancePaid) || 0;
    const totalAmount = Number(body.totalAmount) || 0;
    const balanceDue = totalAmount - advancePaid;

    const rental = await this.prisma.$transaction(async (tx) => {
      // 1. Create Rental Record
      const newRental = await tx.equipmentRental.create({
        data: {
          associationId: targetId,
          equipmentId: body.equipmentId,
          renterName: body.renterName,
          renterPhone: body.renterPhone,
          quantity: Number(body.quantity) || 1,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          totalAmount: totalAmount,
          advancePaid: advancePaid,
          balanceDue: balanceDue,
          notes: body.notes,
        },
      });

      // 2. If advancePaid > 0, credit Main Caisse directly
      if (advancePaid > 0) {
        const mainCaisse = await tx.caisse.findFirst({
          where: { associationId: targetId, type: 'MAIN' },
        });

        if (mainCaisse) {
          await tx.caisse.update({
            where: { id: mainCaisse.id },
            data: { balance: { increment: advancePaid } },
          });

          await tx.transaction.create({
            data: {
              associationId: targetId,
              caisseId: mainCaisse.id,
              type: 'DEPOSIT',
              amount: advancePaid,
              description: `Recette Location Matériel — ${body.renterName}`,
              reference: `RENTAL-${newRental.id.substring(0, 8)}`,
              status: 'CONFIRMED',
            },
          });
        }
      }

      return newRental;
    });

    return rental;
  }
}
