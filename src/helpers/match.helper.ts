import { ChatInputCommandInteraction, CacheType, User } from "discord.js";
import MatchModal from "../models/match";
import UserModal from "../models/user";
import { Ranks } from "../models/enums/ranks";
import { MongooseUser } from "../types/mongoose/User";
import { RanksBreakingPoints } from "../models/enums/ranksBreakingPoints";

export class MatchHelper {
  // static numOfMatchesToGetARank = 10;
  static numOfMatchesToGetARank = 3;

  static getRankBasedOnPoints(points: number): Ranks {
    // TS compiler duplicates the value of an enum, this gets only the half
    const ranks = Object.entries(RanksBreakingPoints).filter(
      (item) => typeof item[1] === "number"
    ) as [string, number][];

    for (let i = 0; i < ranks.length; i++) {
      const current = ranks[i];
      const next = ranks[i + 1];
      if (next && points < next[1] && points >= current[1]) {
        const first = Math.abs(current[1] - points);
        const second = Math.abs(next[1] - points);

        const closest = first < second ? current[0] : next[0];

        return closest as Ranks;
      }
    }

    // if the points were less than nothing, then return the highest rank we have
    return Ranks[Ranks.mk_expert];
  }

  // This would only run when both are unranked. For every other case, see `CheckIfPlayerHasRankedUpOrDown`
  static async CheckIfPlayerGainedARank(
    player1: MongooseUser,
    player2: MongooseUser,
    interaction: ChatInputCommandInteraction<CacheType>
  ) {
    if (player1.rank !== Ranks.unranked && player2.rank !== Ranks.unranked) {
      return;
    }

    const [player1Matches, player2Matches] = await Promise.all([
      MatchModal.find({
        player1Rank: Ranks.unranked,
        $or: [{ player1Name: player1.name }, { player2Name: player1.name }],
      }),
      MatchModal.find({
        player2Rank: Ranks.unranked,
        $or: [{ player1Name: player2.name }, { player2Name: player2.name }],
      }),
    ]);

    const player1CanHaveARankNow =
      player1Matches.length >= MatchHelper.numOfMatchesToGetARank;
    const player2CanHaveARankNow =
      player2Matches.length >= MatchHelper.numOfMatchesToGetARank;

    if (player1CanHaveARankNow) {
      const points = player1.points;
      const rank = MatchHelper.getRankBasedOnPoints(points);
      console.log(rank);
      await UserModal.updateOne({ name: player1.name }, { $set: { rank } });
    }

    if (player2CanHaveARankNow) {
      const points = player2.points;
      const rank = MatchHelper.getRankBasedOnPoints(points);
      console.log(rank);
      await UserModal.updateOne({ name: player2.name }, { $set: { rank } });
    }
  }

  static async CheckIfPlayerHasRankedUpOrDown(
    player1: MongooseUser,
    player2: MongooseUser,
    interaction: ChatInputCommandInteraction<CacheType>
  ) {}

  // :[winnerPoints, loserPoints]
  static calculatePointsWonAndLostInMatch(
    winner: MongooseUser,
    loser: MongooseUser
  ): [number, number] {
    const winnerRank = winner.rank;
    const loserRank = loser.rank;
    const ranksInOrder = Object.keys(Ranks);

    let player1Points = 0,
      player2Points = 0;
    const base = 10;

    const winnerRankIndex = ranksInOrder.findIndex((r) => r === winnerRank);
    const loserRankIndex = ranksInOrder.findIndex((r) => r === loserRank);

    if (winnerRankIndex === loserRankIndex) {
      player1Points = base;
      player2Points = -base;
    } else {
      const bigger = Math.max(winnerRankIndex, loserRankIndex);
      const smaller = Math.min(winnerRankIndex, loserRankIndex);

      const difference = bigger - smaller;

      if (winnerRankIndex === bigger) {
        player1Points = base - difference;
        player2Points = base - difference;
      } else {
        player1Points = base + difference;
        player2Points = base + difference;
      }

      player2Points = -player2Points;
    }

    return [player1Points, player2Points];
  }
}
