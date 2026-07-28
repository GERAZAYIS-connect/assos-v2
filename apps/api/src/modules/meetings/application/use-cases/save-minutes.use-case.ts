import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';

@Injectable()
export class SaveMinutesUseCase {
  constructor(
    @Inject('IMeetingRepository')
    private readonly meetingRepo: IMeetingRepository,
  ) {}

  async execute(meetingId: string, minutes: string): Promise<any> {
    if (!minutes || minutes.trim().length === 0) {
      throw new BadRequestException('Le contenu du procès-verbal ne peut pas être vide.');
    }
    return this.meetingRepo.saveMinutes(meetingId, minutes);
  }
}
