import { Meeting } from '../entities/meeting.entity';
import { AttendanceStatus } from '@prisma/client';

export interface IMeetingRepository {
  resolveAssociationId(idOrSlug: string): Promise<string | null>;
  createMeeting(meeting: Meeting): Promise<Meeting>;
  findById(id: string): Promise<any | null>;
  findByAssociationId(associationId: string): Promise<any[]>;
  updateMeeting(id: string, data: Partial<Meeting>): Promise<any>;

  recordAttendanceAtomic(data: {
    meetingId: string;
    attendances: { memberId: string; status: AttendanceStatus; notes?: string }[];
    createdByUserId?: string;
  }): Promise<any>;

  saveMinutes(meetingId: string, minutes: string): Promise<any>;
}
