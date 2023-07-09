import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";
import MatchModal from "../../models/match";
import { PlayerHelper } from "../../helpers/player.helper";
import { MongooseUser } from "../../types/mongoose/User";

const data = new SlashCommandBuilder()
  .setName("myself")
  .setDescription("Get info about yourself");

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const userId = interaction.user.id;
  const userName = interaction.user.username;

  const [mognoUser, matchesCount, matchesWonByUser] = await Promise.all([
    UserModal.findOne({
      discordId: userId,
    }),
    MatchModal.countDocuments({
      $or: [{ player1Name: userName }, { player2Name: userName }],
    }),
    MatchModal.countDocuments({ winner: userName }),
  ]);

  const winRate = (matchesWonByUser * 100) / matchesCount;

  if (!mognoUser) {
    return interaction.reply(
      "Looks like you aren't registered yet! Use **/reg** to start your journy!"
    );
  }

  interaction.reply(
    PlayerHelper.getInfo(
      mognoUser as unknown as MongooseUser,
      {
        matchesCount,
        winRate,
      },
      true
    )
  );
};

export { data, execute };
