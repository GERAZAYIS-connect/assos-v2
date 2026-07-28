import { Inject, Injectable } from '@nestjs/common';
import { ITontineRepository } from '../../domain/repositories/tontine.repository.interface';

export interface ListTontinesQuery {
  associationId: string;
  memberId?: string;
}

@Injectable()
export class ListTontinesUseCase {
  constructor(
    @Inject('ITontineRepository') private readonly tontineRepo: ITontineRepository,
  ) {}

  async execute(query: ListTontinesQuery) {
    return this.tontineRepo.findByAssociationId(query.associationId, query.memberId);
  }
}
