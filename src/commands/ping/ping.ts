import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Pings and pongs");

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.reply("Pong");
};

export { data, execute };
