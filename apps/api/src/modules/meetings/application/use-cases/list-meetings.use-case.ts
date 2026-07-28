import { Inject, Injectable } from '@nestjs/common';
import { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';

@Injectable()
export class ListMeetingsUseCase {
  constructor(
    @Inject('IMeetingRepository')
    private readonly meetingRepo: IMeetingRepository,
  ) {}

  async execute(associationId: string): Promise<any[]> {
    return this.meetingRepo.findByAssociationId(associationId);
  }
}
