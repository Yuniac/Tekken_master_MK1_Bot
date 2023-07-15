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
  await interaction.deferReply();

  const embeddedUser = interaction.user;
  const user = interaction.options.getUser("name");
  if (!user) {
    return interaction.followUp(
      "Error: Sorry, someting went wrong and we can't process this user at this time."
    );
  }

  const existingUser = await UserModal.findOne({ name: user.username });

  if (existingUser) {
    return interaction.followUp(
      `A user with the name of **${user.username}** already exists. Please choose a different name.`
    );
  }
  const isSelfRegistery = embeddedUser.username === user.username;

  if (!isSelfRegistery) {
    return interaction.followUp(
      `Error: You can only register yourself. You entered username **${user.username}**`
    );
  }

  try {
    const createdUser = await UserModal.create({
      name: user.username,
      isAdmin: false,
      points: 1500,
      rank: Ranks.unranked,
      discordId: user.id,
    });

    const response = `You have been successfully registered as a player in The Mortal Kombat 1 Ladder, your name is: **${createdUser.name}**. You will need this name for most things, try to remember it.

    If you ever need to see your info, use **/myself**.
  `;
    interaction.followUp(response);
  } catch (e: any) {
    console.log(e);
    interaction.followUp(
      `Sorry, something went wrong while storing your user data. Share this error with our developers to help you: "${e}"`
    );
  }
};

export { data, execute };
