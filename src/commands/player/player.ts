import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";
import { format } from "date-fns";
import { StringHelper } from "../../helpers/String.helper";

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
  const mognoUser = await UserModal.findOne({
    name: user?.username,
  });

  if (!mognoUser || !user) {
    return interaction.reply(
      "Error: Looks like this user isn't registered yet. We have no info about them."
    );
  }

  const { id, discordId, name, points, rank, createdAt, isAdmin } = mognoUser;

  interaction.reply(`
      Here's the info that we know about **${name}**:
  
      ${isAdmin ? "-Admin" : ""}
      -ID: ${discordId}
      -Points: ${points}
      -Rank: ${StringHelper.humanize(rank)}
      -Registered at: ${format(new Date(createdAt), "dd-MM-Y K:a")}
    `);
};

export { data, execute };
