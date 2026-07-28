import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { Meeting } from '../../domain/entities/meeting.entity';
import { MeetingType, MeetingStatus } from '@prisma/client';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';
import * as crypto from 'crypto';

export interface CreateMeetingCommand {
  associationId: string;
  title: string;
  description?: string;
  type?: MeetingType;
  location?: string;
  scheduledAt: string | Date;
  agenda?: string;
  autoSanctionAbsence?: boolean;
  absenceFineAmount?: number;
}

@Injectable()
export class CreateMeetingUseCase {
  constructor(
    @Inject('IMeetingRepository')
    private readonly meetingRepo: IMeetingRepository,
  ) {}

  async execute(command: CreateMeetingCommand): Promise<Meeting> {
    const assocId = await this.meetingRepo.resolveAssociationId(command.associationId);
    if (!assocId) {
      throw new NotFoundException('Association', command.associationId);
    }

    if (!command.title || command.title.trim().length === 0) {
      throw new BadRequestException('Le titre de la réunion est obligatoire.');
    }

    if (!command.scheduledAt) {
      throw new BadRequestException('La date de la réunion est obligatoire.');
    }

    const meeting = new Meeting({
      id: crypto.randomUUID(),
      associationId: assocId,
      title: command.title,
      description: command.description || null,
      type: command.type || MeetingType.ORDINARY,
      status: MeetingStatus.SCHEDULED,
      location: command.location || null,
      scheduledAt: new Date(command.scheduledAt),
      agenda: command.agenda || null,
      autoSanctionAbsence: command.autoSanctionAbsence || false,
      absenceFineAmount: command.absenceFineAmount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.meetingRepo.createMeeting(meeting);
  }
}
