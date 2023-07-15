import { MongooseUser } from "./../../types/mongoose/User";
import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import UserModal from "../../models/user";

import MatchModal from "../../models/match";
import { MongoMatch } from "../../types/mongoose/Match";
import { uniq } from "lodash";
// @ts-ignore
import * as StringTable from "string-table";
import { ChannelIds } from "../../models/enums/channelIDs";

const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Gets a detailed run down of a player")
  .addUserOption((option) =>
    option
      .setName("name")
      .setDescription("The name of the player to get info about")
      .setRequired(true)
  );

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const user = interaction.options.getUser("name");

  const [
    mognoUser,
    leaderboard,
    matchesWonByUser,
    matchesLostByUser,
    matchesUserWasIn,
  ] = await Promise.all([
    UserModal.findOne({ name: user?.username }).lean(),
    UserModal.find().sort({ points: -1 }).lean(),
    MatchModal.find({ winner: user?.username }).lean(),
    MatchModal.find({
      $and: [
        { winner: { $ne: user?.username } },
        {
          $or: [
            { player1Name: user?.username },
            { player2Name: user?.username },
          ],
        },
      ],
    }).lean(),
    MatchModal.find({
      $or: [{ player1Name: user?.username }, { player2Name: user?.username }],
    }).populate({ path: "player1 player2" }),
  ]);

  if (!mognoUser || !user) {
    return interaction.reply(
      `Error: Looks like this user (**${user?.username}**) isn't registered yet. We have no info about them.`
    );
  }
  const users = uniq(
    (matchesUserWasIn as unknown as MongoMatch[])
      .map((m) => [m.player1, m.player2])
      .flat()
      .sort((a, b) => (b as MongooseUser)?.points - (a as MongooseUser)?.points)
  );

  const generateLineOfData = (user: MongooseUser) => {
    const matches = matchesUserWasIn.filter((m) =>
      [m.player1Name, m.player2Name].includes(user.name)
    );

    const matchesVsOpponentIWon = matches.filter(
      (m) => m.winner === mognoUser.name
    );

    const name = mognoUser.name;
    const opponentName = user.name;
    const opponentPoints = String(user.points);
    const sets = String(matches.length);
    const score = `${matches.length}-${
      matches.length - matchesVsOpponentIWon.length
    }`;
    const winRate = `%${String(
      Number((matchesVsOpponentIWon.length * 100) / matches.length).toFixed()
    )}`;

    return {
      name,
      opponent: `${opponentName}(${opponentPoints})`,
      sets,
      score,
      winRate,
    };
  };

  const data = users.map((u) =>
    generateLineOfData(u as unknown as MongooseUser)
  );

  const name = mognoUser.name;
  const points = mognoUser.points;
  const leaderboardRank = leaderboard.findIndex(
    ({ name }) => name === user?.username
  );
  const sets = matchesWonByUser.length + matchesLostByUser.length;
  const wins = matchesWonByUser.length;
  const loses = matchesLostByUser.length;
  const winRate = Number(
    (matchesWonByUser.length * 100) /
      (matchesWonByUser.length + matchesLostByUser.length)
  ).toFixed();

  const playerInfo = `#${leaderboardRank} Points:${points}. Sets:${sets}   Wins:${wins}.   Loses:${loses}   Winrate: %${winRate}`;

  const stats = StringTable.create(data, {
    rowSeparator: "-",
    headerSeparator: "~",
    capitalizeHeaders: true,
    formatters: {
      opponent: function (value: string | number) {
        return {
          value: value as string,
          format: {
            color: "cyan",
          },
        };
      },
      winRate: function (value: string | number) {
        return {
          value: value as string,
          format: {
            alignment: "right",
          },
        };
      },
    },
  });

  const message = `${"```ini"}
Below are ${name}'s all time stats:
${playerInfo}
\r  
${stats}

\r  
Tekken Master MK1 Ladder bot.
  ${"```"}`;

  const statsChannel = interaction.client.channels.cache.get(
    ChannelIds.statsDev
  );

  interaction.reply(
    `Stats of ${user.username} are ready to be viewed here: <#${statsChannel?.id}>`
  );

  if (statsChannel) {
    const channel = statsChannel as TextChannel;
    channel.sendTyping();
    channel.send(message);
  }
};

export { data, execute };
