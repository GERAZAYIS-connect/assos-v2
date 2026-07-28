import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditCategory } from '@prisma/client';

export interface CreateAuditLogDto {
  associationId?: string;
  actorId?: string;
  category: AuditCategory;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates an immutable audit log entry.
   * This method never throws — audit failures must not break the main flow.
   */
  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          associationId: dto.associationId ?? null,
          actorId: dto.actorId ?? null,
          category: dto.category,
          action: dto.action,
          targetType: dto.targetType ?? null,
          targetId: dto.targetId ?? null,
          metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
          ipAddress: dto.ipAddress ?? null,
          userAgent: dto.userAgent ?? null,
        },
      });
    } catch (error) {
      // Log to stderr but don't propagate — audit must be non-blocking
      console.error('[AuditService] Failed to write audit log:', error);
    }
  }
}
