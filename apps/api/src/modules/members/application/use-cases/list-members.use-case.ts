import { Injectable, Inject } from '@nestjs/common';
import {
  IMemberRepository,
  MEMBER_REPOSITORY,
} from '../../domain/repositories/member.repository.interface';
import { AssociationRole, MemberStatus } from '@prisma/client';

export interface ListMembersQuery {
  associationId: string;
  status?: MemberStatus;
  role?: AssociationRole;
  search?: string;
}

@Injectable()
export class ListMembersUseCase {
  constructor(
    @Inject(MEMBER_REPOSITORY)
    private readonly memberRepository: IMemberRepository,
  ) {}

  async execute(query: ListMembersQuery) {
    const members = await this.memberRepository.listByAssociation(query.associationId, {
      status: query.status,
      role: query.role,
      search: query.search,
    });

    return members.map((m) => m.toResponseObject());
  }
}
