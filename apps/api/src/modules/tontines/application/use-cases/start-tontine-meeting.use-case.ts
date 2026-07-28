import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { MeetingType, MeetingStatus } from '@prisma/client';

export interface StartTontineMeetingCommand {
  associationId: string;
  tontineId: string;
  location?: string;
  title?: string;
}

@Injectable()
export class StartTontineMeetingUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: StartTontineMeetingCommand) {
    const tontine = await this.prisma.tontine.findUnique({
      where: { id: command.tontineId },
    });

    if (!tontine) {
      throw new NotFoundException('Tontine', command.tontineId);
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        associationId: command.associationId,
        title: command.title || `Réunion Tontine: ${tontine.name}`,
        type: MeetingType.TONTINE_SESSION,
        status: MeetingStatus.IN_PROGRESS,
        location: command.location,
        scheduledAt: new Date(),
        startedAt: new Date(),
        description: `Session en direct pour la tontine ${tontine.name}`,
      },
    });

    return meeting;
  }
}
