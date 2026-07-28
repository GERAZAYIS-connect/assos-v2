import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { Meeting } from '../../domain/entities/meeting.entity';
import { AttendanceStatus, SanctionStatus } from '@prisma/client';

@Injectable()
export class PrismaMeetingRepository implements IMeetingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAssociationId(idOrSlug: string): Promise<string | null> {
    const assoc = await this.prisma.association.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: { id: true },
    });
    return assoc?.id || null;
  }

  async createMeeting(meeting: Meeting): Promise<Meeting> {
    const created = await this.prisma.meeting.create({
      data: {
        id: meeting.id,
        associationId: meeting.associationId,
        title: meeting.title,
        description: meeting.description,
        type: meeting.type,
        status: meeting.status,
        location: meeting.location,
        scheduledAt: meeting.scheduledAt,
        agenda: meeting.agenda,
        autoSanctionAbsence: meeting.autoSanctionAbsence,
        absenceFineAmount: meeting.absenceFineAmount,
      },
    });

    // Auto-populate attendance list with all active association members
    const activeMembers = await this.prisma.associationMember.findMany({
      where: { associationId: meeting.associationId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (activeMembers.length > 0) {
      await this.prisma.meetingAttendance.createMany({
        data: activeMembers.map((m) => ({
          meetingId: created.id,
          memberId: m.id,
          status: AttendanceStatus.ABSENT,
        })),
      });
    }

    return new Meeting(created as any);
  }

  async findById(id: string): Promise<any | null> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        attendances: {
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
    });

    if (!meeting) return null;

    const allMembers = await this.prisma.associationMember.findMany({
      where: { associationId: meeting.associationId, status: 'ACTIVE' },
      include: {
        profile: { select: { firstName: true, lastName: true } },
        user: { select: { email: true } },
      },
    });

    const existingMemberIds = new Set(meeting.attendances.map((a) => a.memberId));
    const missingAttendances = allMembers
      .filter((m) => !existingMemberIds.has(m.id))
      .map((m) => ({
        id: `temp-${m.id}`,
        meetingId: meeting.id,
        memberId: m.id,
        status: AttendanceStatus.ABSENT,
        arrivalTime: null,
        notes: null,
        sanctionId: null,
        member: m,
      }));

    return {
      ...meeting,
      attendances: [...meeting.attendances, ...missingAttendances],
    };
  }

  async findByAssociationId(associationId: string): Promise<any[]> {
    const assocId = await this.resolveAssociationId(associationId);
    if (!assocId) return [];

    return this.prisma.meeting.findMany({
      where: { associationId: assocId },
      include: {
        attendances: {
          select: { id: true, status: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async updateMeeting(id: string, data: Partial<Meeting>): Promise<any> {
    return this.prisma.meeting.update({
      where: { id },
      data: data as any,
    });
  }

  async recordAttendanceAtomic(data: {
    meetingId: string;
    attendances: { memberId: string; status: AttendanceStatus; notes?: string }[];
    createdByUserId?: string;
  }): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.findUnique({
        where: { id: data.meetingId },
      });
      if (!meeting) throw new Error('Réunion introuvable.');

      for (const item of data.attendances) {
        // Upsert attendance record
        const att = await tx.meetingAttendance.upsert({
          where: {
            meetingId_memberId: {
              meetingId: data.meetingId,
              memberId: item.memberId,
            },
          },
          update: {
            status: item.status,
            notes: item.notes || null,
            arrivalTime: item.status === AttendanceStatus.PRESENT || item.status === AttendanceStatus.LATE ? new Date() : null,
          },
          create: {
            meetingId: data.meetingId,
            memberId: item.memberId,
            status: item.status,
            notes: item.notes || null,
            arrivalTime: item.status === AttendanceStatus.PRESENT || item.status === AttendanceStatus.LATE ? new Date() : null,
          },
        });

        // Automatic Sanction for Unexcused Absence if enabled
        if (
          meeting.autoSanctionAbsence &&
          meeting.absenceFineAmount > 0 &&
          item.status === AttendanceStatus.ABSENT &&
          !att.sanctionId
        ) {
          const sanction = await tx.sanction.create({
            data: {
              associationId: meeting.associationId,
              memberId: item.memberId,
              title: `Amende Absence - ${meeting.title}`,
              reason: `Absence non excusée à la réunion`,
              fineAmount: meeting.absenceFineAmount,
              status: SanctionStatus.PENDING,
              issuedByUserId: data.createdByUserId,
            },
          });

          await tx.meetingAttendance.update({
            where: { id: att.id },
            data: { sanctionId: sanction.id },
          });
        }
      }

      // Mark meeting in progress if scheduled
      if (meeting.status === 'SCHEDULED') {
        await tx.meeting.update({
          where: { id: meeting.id },
          data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });
      }
    });

    return this.findById(data.meetingId);
  }

  async saveMinutes(meetingId: string, minutes: string): Promise<any> {
    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        minutes,
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });
  }
}
