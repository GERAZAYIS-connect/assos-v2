import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../auth/domain/repositories/user.repository.interface';
import { IPasswordHasher, PASSWORD_HASHER } from '../../../auth/domain/ports/password-hasher.interface';
import { IMemberRepository, MEMBER_REPOSITORY } from '../../domain/repositories/member.repository.interface';
import { Email } from '../../../auth/domain/value-objects/email.vo';
import { Phone } from '../../../auth/domain/value-objects/phone.vo';
import { ConflictException, ForbiddenException } from '../../../../core/exceptions/global-exception.filter';
import { AssociationRole, MemberStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { AuditService } from '../../../../core/audit/audit.service';

export interface AddMemberManuallyCommand {
  associationId: string;
  actorUserId: string; // The user creating the member (must be PRESIDENT or SECRETARY)
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: AssociationRole;
}

export interface AddMemberManuallyResult {
  memberId: string;
  userId: string;
  defaultPassword?: string;
}

@Injectable()
export class AddMemberManuallyUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
    @Inject(MEMBER_REPOSITORY) private readonly memberRepo: IMemberRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(command: AddMemberManuallyCommand): Promise<AddMemberManuallyResult> {
    // 1. Check actor permissions
    const actorMember = await this.memberRepo.findByAssociationAndUser(
      command.associationId,
      command.actorUserId,
    );

    if (!actorMember || (actorMember.role !== AssociationRole.PRESIDENT && actorMember.role !== AssociationRole.SECRETARY)) {
      throw new ForbiddenException('Only the President or Secretary can add members manually');
    }

    if (!command.email && !command.phone) {
      throw new ConflictException('Either email or phone is required');
    }

    // 2. Validate user identity and check existence
    let normalizedEmail: string | undefined;
    let normalizedPhone: string | undefined;

    if (command.email) {
      normalizedEmail = Email.create(command.email).value;
    }
    if (command.phone) {
      normalizedPhone = Phone.create(command.phone).value;
    }

    let user = undefined;

    if (normalizedEmail) {
      const existingUser = await this.userRepo.findByEmail(normalizedEmail);
      if (existingUser) user = existingUser;
    }

    if (!user && normalizedPhone) {
      const existingUser = await this.userRepo.findByPhone(normalizedPhone);
      if (existingUser) user = existingUser;
    }

    let defaultPassword;

    // 3. Create User if they don't exist
    if (!user) {
      defaultPassword = 'Assos2026!'; // Default secure password
      const passwordHash = await this.hasher.hash(defaultPassword);

      user = await this.userRepo.create({
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
      });

      // TODO: Simulate sending Email/SMS here
      console.log(`[Mock Email/SMS] Sent to ${normalizedEmail || normalizedPhone}: Your account has been created. Password: ${defaultPassword}`);
    }

    // 4. Check if they are already a member
    const existingMember = await this.memberRepo.findByAssociationAndUser(command.associationId, user.id);
    if (existingMember) {
      throw new ConflictException('User is already a member of this association');
    }

    // 5. Create AssociationMember using repository
    const member = await this.memberRepo.createMember(
      command.associationId,
      user.id,
      command.role || AssociationRole.MEMBER
    );

    // 6. Update Profile and save
    member.updateProfile({
      firstName: command.firstName,
      lastName: command.lastName,
    });
    
    // We assume they are active immediately
    if (member.status !== MemberStatus.ACTIVE) {
      member.activate(); // Wait, they might already be active by default, but let's just make sure
    }

    await this.memberRepo.save(member);

    // 7. Audit log
    await this.auditService.log({
      actorId: command.actorUserId,
      category: 'MEMBER',
      action: 'MEMBER_ADDED_MANUALLY',
      targetType: 'AssociationMember',
      targetId: member.id,
      metadata: { associationId: command.associationId, role: member.role },
    });

    return {
      memberId: member.id,
      userId: user.id,
      defaultPassword,
    };
  }
}
