import { Inject, Injectable } from '@nestjs/common';
import { ITontineRepository } from '../../domain/repositories/tontine.repository.interface';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';

@Injectable()
export class GetTontineDetailsUseCase {
  constructor(
    @Inject('ITontineRepository') private readonly tontineRepo: ITontineRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(associationId: string, tontineId: string) {
    const assocId = await this.tontineRepo.resolveAssociationId(associationId);
    if (!assocId) {
      throw new NotFoundException('Association', associationId);
    }

    const tontine = await this.prisma.tontine.findFirst({
      where: { id: tontineId, associationId: assocId },
      include: {
        caisse: { select: { id: true, name: true, balance: true } },
        members: {
          include: {
            member: {
              include: {
                user: { select: { email: true } },
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        rounds: {
          include: {
            beneficiary: {
              include: {
                profile: { select: { firstName: true, lastName: true } },
                user: { select: { email: true } },
              },
            },
            contributions: {
              include: {
                member: {
                  include: {
                    profile: { select: { firstName: true, lastName: true } },
                    user: { select: { email: true } },
                  },
                },
              },
            },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!tontine) {
      throw new NotFoundException('Tontine', tontineId);
    }

    return tontine;
  }
}
