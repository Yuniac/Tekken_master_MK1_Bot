import {
  ChatInputCommandInteraction,
  CacheType,
  User,
  TextChannel,
} from "discord.js";
import MatchModal from "../models/match";
import UserModal from "../models/user";
import { Ranks } from "../models/enums/ranks";
import { MongooseUser } from "../types/mongoose/User";
import { RanksBreakingPoints } from "../models/enums/ranksBreakingPoints";
import { isNumber } from "lodash";
import { StringHelper } from "./String.helper";
// @ts-ignore
import * as StringTable from "string-table";
import { ChannelIds } from "../models/enums/channelIDs";
import { MongoMatch } from "../types/mongoose/Match";
import { basicTabelConfig } from "../util/tabel.config";

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

  static async CheckIfPlayerHasRankedUpOrDown(
    userName: string,
    interaction: ChatInputCommandInteraction<CacheType>,
    discordUser: User
  ) {
    const player = await UserModal.findOne({ name: userName });

    let notfiyUserOfRankChange = false;

    if (!player) {
      return;
    }

    const newRank = MatchHelper.getRankBasedOnPoints(player.points);

    // This would only run when both are unranked. For every other case;
    if (player.rank === Ranks.unranked) {
      const playerMatchesCount = await MatchModal.countDocuments({
        $and: [
          { $or: [{ player1Name: player.name }, { player2Name: player.name }] },
          {
            $or: [
              { player1Rank: Ranks.unranked },
              { player2Rank: Ranks.unranked },
            ],
          },
        ],
      });

      if (playerMatchesCount >= MatchHelper.numOfMatchesToGetARank) {
        notfiyUserOfRankChange = true;
        await UserModal.updateOne(
          { name: userName },
          { $set: { rank: newRank } }
        );
      }
    } else if (player.rank !== newRank) {
      notfiyUserOfRankChange = true;
      await UserModal.findOneAndUpdate({ name: userName }, { rank: newRank });
    }

    if (notfiyUserOfRankChange) {
      const updatedPlayer = (await UserModal.findOne({
        name: userName,
      })) as MongooseUser;

      const ranksInOrder = Object.keys(Ranks);
      const direction =
        player?.rank === Ranks.unranked
          ? "up"
          : ranksInOrder.indexOf(player?.rank) < ranksInOrder.indexOf(newRank)
          ? "up"
          : "down";

      StringHelper.sendRankChangedMessage(
        updatedPlayer as unknown as MongooseUser,
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

  static generateLineOfDataUserByUserForScoreboard(
    user: MongooseUser,
    index: number,
    aulMatches: MongoMatch[]
  ) {
    const matches = aulMatches.filter((m) =>
      [m.player1Name, m.player2Name].includes(user.name)
    );

    const matchesVsOpponentIWon = matches.filter((m) => m.winner === user.name);

    const playerName = user.name;
    const points = user.points;
    const rank = user.rank;
    const sets = String(matches.length);
    const wins = matchesVsOpponentIWon.length;
    const loses = String(matchesVsOpponentIWon.length - matches.length);
    const winRate = `%${
      matchesVsOpponentIWon.length > 0
        ? String(
            Number(
              (matchesVsOpponentIWon.length * 100) / matches.length
            ).toFixed()
          )
        : 0
    }`;

    return {
      "#": `${index + 1}.`,
      name: playerName,
      rating: points,
      rank: StringHelper.humanize(rank),
      sets: `S:${sets}`,
      wins: `W:${wins}`,
      loses: `L:${loses}`,
      winRate: `WinRate ${winRate}`,
    };
  }

  static async getScoreBoardData() {
    const [allPlayers, allMatches] = await Promise.all([
      UserModal.find().sort({ points: -1 }).lean(),
      MatchModal.find().lean(),
    ]);

    const data = allPlayers.map((u, i) =>
      this.generateLineOfDataUserByUserForScoreboard(
        u as unknown as MongooseUser,
        i,
        allMatches as unknown as MongoMatch[]
      )
    );

    const result = StringTable.create(data, basicTabelConfig);

    return StringHelper.buildScoreBoardMesssage(result);
  }

  static async rehydrateScoreBoardMessage(
    interaction: ChatInputCommandInteraction<CacheType>
  ) {
    const channel = (await interaction.client.channels.cache.get(
      ChannelIds.scoreboardDev
    )!) as TextChannel;
    const messages = await channel.messages.fetch({ limit: 1 });
    const scoreboardMessage = messages.first()!;

    const content = scoreboardMessage.edit({
      content: await this.getScoreBoardData(),
    });
  }
}
