import "dotenv/config";
import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";
import { MatchHelper } from "../../helpers/match.helper";
import { MongooseUser } from "../../types/mongoose/User";

const data = new SlashCommandBuilder()
  .setName("calc")
  .setDescription(
    "Calculate the point that can be obtained after a set with a player"
  )
  .addUserOption((option) =>
    option
      .setName("opponent")
      .setDescription("The opponent name")
      .setRequired(true)
  );

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const opponent = interaction.options.getUser("opponent");
  const user = interaction.user;

  if (!user || !opponent) {
    return interaction.reply(
      "Error: Sorry, someting went wrong and we can't process this user at this time."
    );
  }

  try {
    const [mongoUser, mongoOpponent] = await Promise.all([
      UserModal.findOne({ name: user.username }),
      UserModal.findOne({ name: opponent.username }),
    ]);

    if (!mongoUser) {
      return interaction.reply(
        `Error: There's no registered user with the name **${user.username}**. User must be registered before you can calculate your points against them.`
      );
    }

    if (!mongoOpponent) {
      return interaction.reply(
        `Error: There's no registered user with the name **${opponent.username}**. User must be registered before you can calculate your points against them.`
      );
    }

    const ifPlayerWin = MatchHelper.calculatePointsWonAndLostInMatch(
      mongoUser as unknown as MongooseUser,
      mongoOpponent as unknown as MongooseUser
    );
    const ifPlayerLose = MatchHelper.calculatePointsWonAndLostInMatch(
      mongoOpponent as unknown as MongooseUser,
      mongoUser as unknown as MongooseUser
    );

    interaction.reply(`
    VS **${opponent.username}**. Their rank is: **${mongoOpponent.rank}**, your rank is: **${mongoUser.rank}**

    If you win against **${opponent.username}**:
        -You gain: **+${ifPlayerWin[0]}** points
        -They lose: **${ifPlayerWin[1]}** points


    If you lose against **${opponent.username}**:
        -You lose: **${ifPlayerLose[1]}** points
        -They gain: **+${ifPlayerLose[0]}** points
    `);
  } catch (e: any) {
    console.log(e);
    interaction.reply(
      `Error: Sorry, something went wrong while storing your user data. Share this error with our developers to help you: "${e}"`
    );
  }
};

export { data, execute };
