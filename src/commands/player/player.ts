import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";

import MatchModal from "../../models/match";
import { StringHelper } from "../../helpers/String.helper";
import { format } from "date-fns";
import { isNumber } from "lodash";
import { EmojisIds } from "../../models/enums/emojisIDs";

const data = new SlashCommandBuilder()
  .setName("player")
  .setDescription("Gets info about a specific player")
  .addUserOption((option) =>
    option
      .setName("name")
      .setDescription("The name of the player to get info about")
      .setRequired(true)
  );

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.deferReply();
  const user = interaction.options.getUser("name");

  const [mongoUser, matchesCount, matchesWonByUser, leaderboard] =
    await Promise.all([
      UserModal.findOne({
        name: user?.username,
      }),
      MatchModal.countDocuments({
        $or: [{ player1Name: user?.username }, { player2Name: user?.username }],
      }),
      MatchModal.countDocuments({ winner: user?.username }),
      UserModal.find().sort({ points: -1 }).lean(),
    ]);

  const leaderboardRank =
    leaderboard.findIndex(({ name }) => name === user?.username) + 1;

  if (!mongoUser || !user) {
    return interaction.followUp(
      `Error: Looks like this user (**${user?.username}**) isn't registered yet. We have no info about them.`
    );
  }

  const winRate = (matchesWonByUser * 100) / matchesCount;
  const { name, points, rank, createdAt } = mongoUser;
  const fields = [
    {
      name: "Points",
      value: String(points),
      inline: false,
    },
    {
      name: "Rank",
      value: rank,
      inline: false,
    },
    {
      name: "Registered at",
      value: format(new Date(createdAt), "dd-MM-Y"),
      inline: false,
    },
    {
      name: "Sets played",
      value: String(matchesCount),
      inline: false,
    },
    {
      name: "Ladder position",
      value: `#${String(leaderboardRank)}`,
      inline: false,
    },
  ];

  if (isNumber(winRate) && !isNaN(winRate)) {
    fields.push({
      name: "Win Rate",
      value: String(Math.round(winRate!)),
      inline: false,
    });
  }

  const message = await interaction.followUp({
    embeds: [
      StringHelper.buildEmebd(
        {
          title: `**${name}**`,
          description: `Here's the info that we know about **${name}**:`,
          fields,
        },
        interaction
      ),
    ],
  });

  if (leaderboardRank <= 3) {
    // @ts-ignore indexing is correct
    message.react(EmojisIds[`rank${leaderboardRank}`]);
  }
};

const cooldown = 2;

export { data, execute, cooldown };
