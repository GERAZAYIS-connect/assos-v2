import { Injectable, BadRequestException } from '@nestjs/common';

export interface Bid {
  memberId: string;
  amount: number;
}

export interface SimulateTontineAuctionCommand {
  tontineId: string;
  amountPerRound: number;
  totalMembers: number;
  bids: Bid[];
}

export interface AuctionSimulationResult {
  winnerMemberId: string | null;
  highestBid: number;
  potToDisburse: number;
  generatedInterest: number;
}

@Injectable()
export class SimulateTontineAuctionUseCase {
  async execute(command: SimulateTontineAuctionCommand): Promise<AuctionSimulationResult> {
    if (!command.bids || command.bids.length === 0) {
      throw new BadRequestException('Au moins une enchère est requise pour simuler');
    }

    if (command.amountPerRound <= 0 || command.totalMembers <= 0) {
      throw new BadRequestException('Le montant par tour et le nombre de membres doivent être positifs');
    }

    const totalCollected = command.amountPerRound * command.totalMembers;

    let highestBid = 0;
    let winnerMemberId: string | null = null;

    for (const bid of command.bids) {
      if (bid.amount > highestBid) {
        highestBid = bid.amount;
        winnerMemberId = bid.memberId;
      }
    }

    if (highestBid >= totalCollected) {
      throw new BadRequestException('L\'enchère ne peut pas dépasser ou égaler la cagnotte totale');
    }

    const potToDisburse = totalCollected - highestBid;
    const generatedInterest = highestBid;

    return {
      winnerMemberId,
      highestBid,
      potToDisburse,
      generatedInterest,
    };
  }
}
