import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ITontineRepository } from '../../domain/repositories/tontine.repository.interface';
import { Tontine } from '../../domain/entities/tontine.entity';
import { TontineType, TontineFrequency, TontineStatus } from '@prisma/client';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';
import * as crypto from 'crypto';

export interface CreateTontineCommand {
  associationId: string;
  name: string;
  description?: string;
  type?: TontineType;
  amountPerRound: number;
  frequency?: TontineFrequency;
  caisseId?: string;
  memberIds: string[];
}

@Injectable()
export class CreateTontineUseCase {
  constructor(
    @Inject('ITontineRepository') private readonly tontineRepo: ITontineRepository,
  ) {}

  async execute(command: CreateTontineCommand): Promise<Tontine> {
    const assocId = await this.tontineRepo.resolveAssociationId(command.associationId);
    if (!assocId) {
      throw new NotFoundException('Association', command.associationId);
    }

    if (!command.amountPerRound || command.amountPerRound <= 0) {
      throw new BadRequestException('Le montant par tour doit être supérieur à zéro.');
    }

    if (!command.memberIds || command.memberIds.length === 0) {
      throw new BadRequestException('Une tontine doit compter au moins un membre participant.');
    }

    const tontine = new Tontine({
      id: crypto.randomUUID(),
      associationId: assocId,
      caisseId: command.caisseId || null,
      name: command.name,
      description: command.description || null,
      type: command.type || TontineType.FIXED_ORDER,
      amountPerRound: command.amountPerRound,
      frequency: command.frequency || TontineFrequency.MONTHLY,
      status: TontineStatus.ACTIVE,
      startDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.tontineRepo.createTontine(tontine, command.memberIds);
  }
}
