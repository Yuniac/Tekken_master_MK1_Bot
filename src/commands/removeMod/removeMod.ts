import "dotenv/config";
import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";

const data = new SlashCommandBuilder()
  .setName("remove-admin")
  .setDescription("Removes a user as an admin")
  .addUserOption((option) =>
    option
      .setName("name")
      .setDescription("The user name to demote as an admin")
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
  const existingUser = await UserModal.findOne({ name });

  if (!existingUser) {
    return interaction.reply(
      `There's no registered user with the name **${name}**. User must be registered before they can be made an admin.`
    );
  }

  if (existingUser && existingUser.isAdmin === false) {
    return interaction.reply(
      `User **${name}** is not admin. To make a user an admin, use **/make-admin** instead.`
    );
  }

  try {
    await UserModal.findOneAndUpdate({ name }, { $set: { isAdmin: false } });

    interaction.reply(`**${existingUser.name}** has been demoted as an admin.`);
  } catch (e: any) {
    console.log(e);
    interaction.reply(
      `Sorry, something went wrong while storing your user data. Share this error with our developers to help you: "${e}"`
    );
  }
};

export { data, execute };