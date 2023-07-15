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
  .setName("myself")
  .setDescription("Get info about yourself");

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.deferReply();

  const userId = interaction.user.id;
  const userName = interaction.user.username;

  const [mongoUser, matchesCount, matchesWonByUser, leaderboard] =
    await Promise.all([
      UserModal.findOne({
        discordId: userId,
      }),
      MatchModal.countDocuments({
        $or: [{ player1Name: userName }, { player2Name: userName }],
      }),
      MatchModal.countDocuments({ winner: userName }),
      UserModal.find().sort({ points: -1 }).lean(),
    ]);

  const winRate = (matchesWonByUser * 100) / matchesCount;

  if (!mongoUser) {
    return interaction.reply(
      "Looks like you aren't registered yet! Use **/reg** to start your journy!"
    );
  }

  const leaderboardRank =
    leaderboard.findIndex(({ name }) => name === mongoUser.name) + 1;

  const { name, points, rank, createdAt, isAdmin } = mongoUser;
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

  if (isNumber(winRate)) {
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
          description: `Hey, **${name}**. ${
            isAdmin ? `You are an admin.` : ""
          }`,
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

export { data, execute };
