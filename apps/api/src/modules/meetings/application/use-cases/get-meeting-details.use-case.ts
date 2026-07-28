import { Inject, Injectable } from '@nestjs/common';
import { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { NotFoundException } from '../../../../core/exceptions/global-exception.filter';

@Injectable()
export class GetMeetingDetailsUseCase {
  constructor(
    @Inject('IMeetingRepository')
    private readonly meetingRepo: IMeetingRepository,
  ) {}

  async execute(meetingId: string): Promise<any> {
    const meeting = await this.meetingRepo.findById(meetingId);
    if (!meeting) {
      throw new NotFoundException('Réunion', meetingId);
    }
    return meeting;
  }
}
