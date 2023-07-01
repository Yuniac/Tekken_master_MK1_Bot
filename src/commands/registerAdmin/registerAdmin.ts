import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";
import { Ranks } from "../../models/enums/ranks";

const data = new SlashCommandBuilder()
  .setName("reg-admin")
  .setDescription("Register a user as an admin")
  .addUserOption((option) =>
    option
      .setName("name")
      .setDescription("Enter your unique user name to be registered with")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("password").setDescription("password").setRequired(true)
  );

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const user = interaction.options.getUser("name");
  const password = interaction.options.getString("password");

  const _password = process.env.adminPassword;

  if (password !== _password) {
    return interaction.reply(
      "Incorrect password. This command is only available for admins"
    );
  }

  if (!user) {
    return interaction.reply(
      "Sorry, someting went wrong and we can't process this user at this time."
    );
  }

  const name = user.username;
  const userExist = await UserModal.findOne({ name });

  if (userExist) {
    return interaction.reply(
      `A user with the name of **${name}** already exists. Use **/make-admin** instead, to promote an already registered member to an admin.`
    );
  }

  try {
    const createdUser = await UserModal.create({
      name,
      isAdmin: true,
      points: 1500,
      rank: Ranks.unranked,
      discordId: user.id,
    });

    interaction.reply(
      `You have been successfully registered as as an admin, your name is: **${createdUser.name}**. You will need this name for most things, try to remember it. This is your ID: **${createdUser.id}**`
    );
  } catch (e: any) {
    console.log(e);
    interaction.reply(
      `Sorry, something went wrong while storing your user data. Share this error with our developers to help you: "${e}"`
    );
  }
};

export { data, execute };
