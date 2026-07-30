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
import { AssociationRoleGuard } from '../../../../common/guards/association-role.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';

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
@UseGuards(AuthGuard('jwt'), AssociationRoleGuard)
export class MeetingsController {
  constructor(
    private readonly createMeetingUseCase: CreateMeetingUseCase,
    private readonly listMeetingsUseCase: ListMeetingsUseCase,
    private readonly getMeetingDetailsUseCase: GetMeetingDetailsUseCase,
    private readonly recordAttendanceUseCase: RecordAttendanceUseCase,
    private readonly saveMinutesUseCase: SaveMinutesUseCase,
  ) {}

  /** GET /meetings — Tous les membres actifs (réunions visibles par tous) */
  @Get()
  @Roles() // Tous membres
  async listMeetings(@Param('associationId') associationId: string, @Request() req?: any) {
    return this.listMeetingsUseCase.execute(req?.resolvedAssociationId || associationId);
  }

  /** GET /meetings/:id — Tous les membres actifs */
  @Get(':meetingId')
  @Roles() // Tous membres
  async getMeetingDetails(@Param('meetingId') meetingId: string) {
    return this.getMeetingDetailsUseCase.execute(meetingId);
  }

  /** POST /meetings — SECRETARY + PRESIDENT (organisation des réunions) */
  @Post()
  @Roles('SECRETARY')
  async createMeeting(
    @Param('associationId') associationId: string,
    @Body() dto: CreateMeetingDto,
    @Request() req?: any,
  ) {
    const meeting = await this.createMeetingUseCase.execute({
      ...dto,
      associationId: req?.resolvedAssociationId || associationId,
    });
    return meeting.toJSON();
  }

  /** POST /meetings/:id/attendance — SECRETARY + CENSOR + PRESIDENT (saisie présences) */
  @Post(':meetingId/attendance')
  @Roles('SECRETARY', 'CENSOR')
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

  /** POST /meetings/:id/minutes — SECRETARY + PRESIDENT (rédaction PV) */
  @Post(':meetingId/minutes')
  @Roles('SECRETARY')
  async saveMinutes(
    @Param('meetingId') meetingId: string,
    @Body() dto: SaveMinutesDto,
  ) {
    return this.saveMinutesUseCase.execute(meetingId, dto.minutes);
  }
}
