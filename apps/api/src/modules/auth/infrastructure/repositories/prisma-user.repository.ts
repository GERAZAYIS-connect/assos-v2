import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { Language } from '@assos/shared';
import { User } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: User): UserEntity {
    return new UserEntity({
      id: record.id,
      email: record.email,
      phone: record.phone,
      passwordHash: record.passwordHash,
      platformRole: record.platformRole,
      isEmailVerified: record.isEmailVerified,
      isPhoneVerified: record.isPhoneVerified,
      twoFactorEnabled: record.twoFactorEnabled,
      preferredLanguage: record.preferredLanguage as Language,
      createdAt: record.createdAt,
      deletedAt: record.deletedAt,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    return record ? this.toDomain(record) : null;
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    const record = await this.prisma.user.findUnique({ where: { phone } });
    return record ? this.toDomain(record) : null;
  }

  async create(data: {
    email?: string;
    phone?: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    const record = await this.prisma.user.create({
      data: {
        email: data.email ?? null,
        phone: data.phone ?? null,
        passwordHash: data.passwordHash,
      },
    });
    return this.toDomain(record);
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  async phoneExists(phone: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { phone } });
    return count > 0;
  }
}
