import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";
import { DiscordRoles } from "../../models/enums/discordRoles";

const data = new SlashCommandBuilder()
  .setName("make-admin")
  .setDescription("Upgrades a user to an admin")
  .addUserOption((option) =>
    option
      .setName("name")
      .setDescription("The user name to make admin")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("password").setDescription("password").setRequired(true)
  );

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.deferReply({ ephemeral: true });
  const user = interaction.options.getUser("name");
  const password = interaction.options.getString("password");

  const _password = process.env.adminPassword;

  if (password !== _password) {
    return interaction.followUp(
      "Error: Incorrect password. This command is only available for admins"
    );
  }

  if (!user) {
    return interaction.followUp(
      "Error: Sorry, someting went wrong and we can't process this user at this time."
    );
  }

  const name = user.username;
  const existingUser = await UserModal.findOne({ name });

  if (!existingUser) {
    return interaction.followUp(
      `Error: There's no registered user with the name **${name}**. User must be registered before they can be made an admin.`
    );
  }

  if (existingUser && existingUser.isAdmin === true) {
    return interaction.followUp(
      `Error: User **${name}** is an admin already. To demote them, use **/remove-admin** instead.`
    );
  }

  try {
    await UserModal.findOneAndUpdate({ name }, { $set: { isAdmin: true } });

    const modRole = interaction.guild?.roles.cache.find(
      (r) => r.name === DiscordRoles.mod
    );
    const member = interaction.guild?.members.cache.find(
      (member) => member.user.username === user.username
    );

    if (modRole && member) {
      member.roles.add(modRole);
      interaction.followUp(`**${existingUser.name}** has been made an admin.`);
    } else {
      interaction.followUp(
        "Something went wrong while assigning the roles for user. You might be missing the correct roles"
      );
    }
  } catch (e: any) {
    console.log(e);
    interaction.followUp(
      `Error: Sorry, something went wrong while storing your user data. Share this error with our developers to help you: "${e}"`
    );
  }
};

export { data, execute };
