import { MongooseUser } from "./../../types/mongoose/User";
import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";
import { PlayerHelper } from "../../helpers/player.helper";

import MatchModal from "../../models/match";

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
  const user = interaction.options.getUser("name");

  const [mognoUser, matchesCount, matchesWonByUser] = await Promise.all([
    UserModal.findOne({
      name: user?.username,
    }),
    MatchModal.countDocuments({
      $or: [{ player1Name: user?.username }, { player2Name: user?.username }],
    }),
    MatchModal.countDocuments({ winner: user?.username }),
  ]);

  if (!mognoUser || !user) {
    return interaction.reply(
      "Error: Looks like this user isn't registered yet. We have no info about them."
    );
  }

  const winRate = (matchesWonByUser * 100) / matchesCount;

  interaction.reply(
    PlayerHelper.getInfo(mognoUser as unknown as MongooseUser, {
      winRate,
      matchesCount,
    })
  );
};

export { data, execute };
