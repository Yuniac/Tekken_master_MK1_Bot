import {
  ChatInputCommandInteraction,
  CacheType,
  TextChannel,
  EmbedField,
  User,
} from "discord.js";
import MatchModal from "../models/match";
import UserModal from "../models/user";
import { Ranks } from "../models/enums/ranks";
import { MongooseUser } from "../types/mongoose/User";
import { RanksBreakingPoints } from "../models/enums/ranksBreakingPoints";
import { format } from "date-fns";
import { isNumber } from "lodash";
import { StringHelper } from "./String.helper";
import { ChannelIds } from "../models/enums/channelIDs";

export class MatchHelper {
  static numOfMatchesToGetARank = 5;
  static basePoints = [10, 10, 10, 8, 8, 8, 5];
  static pointsCalcBase = 30;

  static getRankBasedOnPoints(points: number): Ranks {
    // TS compiler duplicates the value of an enum, this gets only the half
    const ranks = Object.entries(RanksBreakingPoints).filter(
      (item) => typeof item[1] === "number"
    ) as [string, number][];

    for (let i = 0; i < ranks.length; i++) {
      const current = ranks[i];
      const next = ranks[i + 1];
      if (next) {
        if (points >= current[1] && points < next[1]) {
          return current[0] as Ranks;

          // Un-comment and use below, instead of above, to:
          // get the cloest of two ranks instead of falling back to within one range.
          // points: 1564
          // method A) (used above) will grant the player `medium` by falling back from 1564-- till it reaches a number that has a rank
          // which is, 1400 = medium
          // method B) (used below) will grant the player `semi_pro` by finding the clost number to 1564, both searching forward and backward that has a rank, which is
          // 1600 = medium

          // const first = Math.abs(current[1] - points);
          // const second = Math.abs(next[1] - points);

          // const closest = first < second ? current[0] : next[0];

          // return closest as Ranks;
        }
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
      await UserModal.updateOne({ name: player1.name }, { $set: { rank } });
    }

    if (player2CanHaveARankNow) {
      const points = player2.points;
      const rank = MatchHelper.getRankBasedOnPoints(points);
      await UserModal.updateOne({ name: player2.name }, { $set: { rank } });
    }
  }

  static async CheckIfPlayerHasRankedUpOrDown(
    player: MongooseUser,
    interaction: ChatInputCommandInteraction<CacheType>,
    discordUser: User
  ) {
    const newRank = MatchHelper.getRankBasedOnPoints(player.points);

    if (newRank !== player.rank) {
      await UserModal.findOneAndUpdate(
        { name: player.name },
        { rank: newRank }
      );
      const user = await UserModal.findOne({ name: player.name });

      const ranksInOrder = Object.keys(Ranks);
      const direction =
        ranksInOrder.indexOf(player.rank) < ranksInOrder.indexOf(newRank)
          ? "up"
          : "down";

      StringHelper.sendRankChangedMessage(
        user as unknown as MongooseUser,
        direction,
        interaction,
        discordUser
      );
    }
  }

  static calculateNewPointsOfWinnerAndLoser(
    winner: MongooseUser,
    loser: MongooseUser
  ): [number, number] {
    const winnerPoints = winner.points;
    const loserPoints = loser.points;

    let player1Probability = MatchHelper.CalculateProbability(
      loser.points,
      winner.points
    );
    let player2Probability = MatchHelper.CalculateProbability(
      winner.points,
      loser.points
    );

    let player1Result, player2Result;

    player1Result =
      winnerPoints + MatchHelper.pointsCalcBase * (1 - player1Probability);
    player2Result =
      loserPoints + MatchHelper.pointsCalcBase * (0 - player2Probability);

    return [Math.round(player1Result), Math.round(player2Result)];
  }

  private static CalculateProbability(
    winnerPoints: number,
    loserPoints: number
  ) {
    return (
      (1.0 * 1.0) /
      (1 + 1.0 * Math.pow(10, (1.0 * (winnerPoints - loserPoints)) / 400))
    );
  }

  static canDisplayScores(
    player1Score: number | null,
    player2Score: number | null
  ) {
    return (
      isNumber(player1Score) &&
      player1Score >= 0 &&
      isNumber(player2Score) &&
      player2Score >= 0
    );
  }
}
