import { Module } from '@nestjs/common';
import { MeetingsController } from './interfaces/http/meetings.controller';
import { CreateMeetingUseCase } from './application/use-cases/create-meeting.use-case';
import { ListMeetingsUseCase } from './application/use-cases/list-meetings.use-case';
import { GetMeetingDetailsUseCase } from './application/use-cases/get-meeting-details.use-case';
import { RecordAttendanceUseCase } from './application/use-cases/record-attendance.use-case';
import { SaveMinutesUseCase } from './application/use-cases/save-minutes.use-case';
import { PrismaMeetingRepository } from './infrastructure/repositories/prisma-meeting.repository';
import { PrismaService } from '../../core/prisma/prisma.service';

@Module({
  controllers: [MeetingsController],
  providers: [
    {
      provide: 'IMeetingRepository',
      useClass: PrismaMeetingRepository,
    },
    PrismaService,
    CreateMeetingUseCase,
    ListMeetingsUseCase,
    GetMeetingDetailsUseCase,
    RecordAttendanceUseCase,
    SaveMinutesUseCase,
  ],
  exports: ['IMeetingRepository'],
})
export class MeetingsModule {}
