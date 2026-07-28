import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { AttendanceStatus } from '@prisma/client';

export interface RecordAttendanceCommand {
  meetingId: string;
  attendances: { memberId: string; status: AttendanceStatus; notes?: string }[];
  createdByUserId?: string;
}

@Injectable()
export class RecordAttendanceUseCase {
  constructor(
    @Inject('IMeetingRepository')
    private readonly meetingRepo: IMeetingRepository,
  ) {}

  async execute(command: RecordAttendanceCommand): Promise<any> {
    if (!command.attendances || command.attendances.length === 0) {
      throw new BadRequestException('Aucune présence n\'a été transmise.');
    }
    return this.meetingRepo.recordAttendanceAtomic(command);
  }
}
