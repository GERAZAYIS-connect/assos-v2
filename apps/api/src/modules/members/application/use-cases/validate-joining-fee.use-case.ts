import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AssociationRole } from '@prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';

export interface ValidateJoiningFeeCommand {
  associationId: string;
  memberUserId: string; // The user ID of the member whose fee is validated
  validatedByUserId: string; // The user ID of the president/treasurer validating the fee
}

@Injectable()
export class ValidateJoiningFeeUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: ValidateJoiningFeeCommand) {
    // 1. Verify the validator has the right role
    const validator = await this.prisma.associationMember.findUnique({
      where: {
        associationId_userId: {
          associationId: command.associationId,
          userId: command.validatedByUserId,
        },
      },
    });

    const allowedRoles: AssociationRole[] = [AssociationRole.PRESIDENT, AssociationRole.TREASURER];
    if (!validator || !allowedRoles.includes(validator.role)) {
      throw new UnauthorizedException('Only the president or treasurer can validate joining fees');
    }

    // 2. Find the target member
    const targetMember = await this.prisma.associationMember.findUnique({
      where: {
        associationId_userId: {
          associationId: command.associationId,
          userId: command.memberUserId,
        },
      },
      include: {
        association: true,
      }
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this association');
    }

    // 3. Mark the joining fee as paid
    const updatedMember = await this.prisma.associationMember.update({
      where: {
        associationId_userId: {
          associationId: command.associationId,
          userId: command.memberUserId,
        },
      },
      data: {
        joiningFeePaidAt: new Date(),
      },
    });

    return updatedMember;
  }
}
