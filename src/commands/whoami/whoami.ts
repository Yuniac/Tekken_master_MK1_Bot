import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";

const data = new SlashCommandBuilder()
  .setName("whoami")
  .setDescription("Gets info about yourself");

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const mognoUser = await UserModal.findOne({
    discordId: interaction.user.id,
  });

  if (!mognoUser) {
    return interaction.reply(
      "Looks like you aren't registered yet. Use **/reg** to start your journy!"
    );
  }

  const { id, discordId, name, points, rank, isAdmin } = mognoUser;

  interaction.reply(`
    Hey, **${name}**. ${isAdmin ? `You are an admin.` : ""}

    -ID: ${discordId}
    -Points: ${points}
    -Rank: ${rank}
  `);
};

export { data, execute };
