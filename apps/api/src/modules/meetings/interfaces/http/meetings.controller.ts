import { Body, Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { CreateMeetingUseCase } from '../../application/use-cases/create-meeting.use-case';
import { ListMeetingsUseCase } from '../../application/use-cases/list-meetings.use-case';
import { GetMeetingDetailsUseCase } from '../../application/use-cases/get-meeting-details.use-case';
import { RecordAttendanceUseCase } from '../../application/use-cases/record-attendance.use-case';
import { SaveMinutesUseCase } from '../../application/use-cases/save-minutes.use-case';
import { MeetingType, AttendanceStatus } from '@prisma/client';

class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MeetingType)
  @IsOptional()
  type?: MeetingType;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsString()
  @IsOptional()
  agenda?: string;

  @IsBoolean()
  @IsOptional()
  autoSanctionAbsence?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  absenceFineAmount?: number;
}

class AttendanceItemDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

class RecordAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  attendances: AttendanceItemDto[];
}

class SaveMinutesDto {
  @IsString()
  @IsNotEmpty()
  minutes: string;
}

@Controller('associations/:associationId/meetings')
@UseGuards(AuthGuard('jwt'))
export class MeetingsController {
  constructor(
    private readonly createMeetingUseCase: CreateMeetingUseCase,
    private readonly listMeetingsUseCase: ListMeetingsUseCase,
    private readonly getMeetingDetailsUseCase: GetMeetingDetailsUseCase,
    private readonly recordAttendanceUseCase: RecordAttendanceUseCase,
    private readonly saveMinutesUseCase: SaveMinutesUseCase,
  ) {}

  @Get()
  async listMeetings(@Param('associationId') associationId: string) {
    return this.listMeetingsUseCase.execute(associationId);
  }

  @Get(':meetingId')
  async getMeetingDetails(@Param('meetingId') meetingId: string) {
    return this.getMeetingDetailsUseCase.execute(meetingId);
  }

  @Post()
  async createMeeting(
    @Param('associationId') associationId: string,
    @Body() dto: CreateMeetingDto,
  ) {
    const meeting = await this.createMeetingUseCase.execute({
      ...dto,
      associationId,
    });
    return meeting.toJSON();
  }

  @Post(':meetingId/attendance')
  async recordAttendance(
    @Param('meetingId') meetingId: string,
    @Body() dto: RecordAttendanceDto,
    @Request() req: any,
  ) {
    return this.recordAttendanceUseCase.execute({
      meetingId,
      attendances: dto.attendances,
      createdByUserId: req.user?.id,
    });
  }

  @Post(':meetingId/minutes')
  async saveMinutes(
    @Param('meetingId') meetingId: string,
    @Body() dto: SaveMinutesDto,
  ) {
    return this.saveMinutesUseCase.execute(meetingId, dto.minutes);
  }
}
