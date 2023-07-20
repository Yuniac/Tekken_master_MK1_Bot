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
import { sortedUniqBy } from "lodash";
// @ts-ignore
import * as StringTable from "string-table";
import { ChannelIds } from "../../models/enums/channelIDs";
import { basicTabelConfig } from "../../util/tabel.config";

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
  await interaction.deferReply();

  const user = interaction.options.getUser("name");

  const [
    mongoUser,
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

  if (!mongoUser || !user) {
    return interaction.reply(
      `Error: Looks like this user (**${user?.username}**) isn't registered yet. We have no info about them.`
    );
  }
  const users = sortedUniqBy(
    (matchesUserWasIn as unknown as MongoMatch[])
      .map((m) => [m.player1, m.player2])
      .flat()
      .filter((user) => user?.name !== mongoUser.name)
      .sort(
        (a, b) => (b as MongooseUser)?.points - (a as MongooseUser)?.points
      ),
    (user) => user?._id.valueOf()
  );

  const generateLineOfDataUserByUser = (user: MongooseUser) => {
    const matches = matchesUserWasIn.filter((m) =>
      [m.player1Name, m.player2Name].includes(user.name)
    );

    const matchesVsOpponentIWon = matches.filter(
      (m) => m.winner === mongoUser?.name
    );

    const name = mongoUser.name;
    const opponentName = user.name;
    const opponentPoints = String(user.points);
    const sets = String(matches.length);
    const score = `${matchesVsOpponentIWon.length}-${matches.length}`;
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
    generateLineOfDataUserByUser(u as unknown as MongooseUser)
  );

  const generateHeader = () => {
    const points = mongoUser.points;
    const leaderboardRank = leaderboard.findIndex(
      ({ name }) => name === user?.username
    );
    const sets = matchesWonByUser.length + matchesLostByUser.length;
    const wins = matchesWonByUser.length;
    const loses = matchesLostByUser.length;
    const winRate = Number(
      (matchesWonByUser.length * 100) / matchesUserWasIn.length
    ).toFixed();

    return `#${leaderboardRank} Points:${points}. Sets:${sets}   Wins:${wins}.   Loses:${loses}   Winrate: %${winRate}`;
  };

  const stats = StringTable.create(data, {
    ...basicTabelConfig,
    rowSeparator: ".",
    formatters: {
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

  const message = `${"```cpp"}
Below are ${mongoUser.name}'s all time stats:
${generateHeader()}
\r  
${stats}

\r  
Tekken Master MK1 Ladder bot.${"```"}`;

  const statsChannel = interaction.client.channels.cache.get(ChannelIds.stats);

  interaction.followUp(
    `Stats of ${user.username} are ready to be viewed here: <#${statsChannel?.id}>`
  );

  if (statsChannel) {
    const channel = statsChannel as TextChannel;
    channel.sendTyping();
    channel.send(message);
  }
};

const cooldown = 5;

export { data, execute, cooldown };
