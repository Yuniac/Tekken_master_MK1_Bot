import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";
import { Ranks } from "../../models/enums/ranks";

const data = new SlashCommandBuilder()
  .setName("reg")
  .setDescription("Register a user as a player")
  .addUserOption((option) =>
    option
      .setName("name")
      .setDescription("Enter your unique user name to be registered with")
      .setRequired(true)
  );

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const user = interaction.options.getUser("name");
  if (!user) {
    return interaction.reply(
      "Sorry, someting went wrong and we can't process this user at this time."
    );
  }

  const name = user.username;
  const userExist = await UserModal.findOne({ name });

  if (userExist) {
    return interaction.reply(
      `A user with the name of **${name}** already exists. Please choose a different name.`
    );
  }

  try {
    const createdUser = await UserModal.create({
      name,
      isAdmin: false,
      points: 1500,
      rank: Ranks.unranked,
      discordId: user.id,
    });

    interaction.reply(
      `You have been successfully registered as a player, your name is: **${createdUser.name}**. You will need this name for most things, try to remember it. This is your ID: **${createdUser.id}**`
    );
  } catch (e: any) {
    console.log(e);
    interaction.reply(
      `Sorry, something went wrong while storing your user data. Share this error with our developers to help you: "${e}"`
    );
  }
};

export { data, execute };
