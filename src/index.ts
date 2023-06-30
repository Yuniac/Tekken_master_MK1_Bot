import "dotenv/config";
import { Client, GatewayIntentBits, Collection, Events } from "discord.js";
import path from "path";
import fs from "fs";
import { DiscordClient } from "./types/client";

console.log("Welcome. Firing up!");
console.log("Loading...");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
}) as Client<boolean> & {
  commands: Map<string, { data: Function; execute: Function }>;
};

client.login(process.env.discord_token);

client.commands = new Map();
const rootCommandsDirath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(rootCommandsDirath)
  .filter((file) => file.endsWith(".ts"));

for (const commandFile of commandFiles) {
  const filePath = path.join(rootCommandsDirath, commandFile);
  const command = require(filePath) as { data: Function; execute: Function };

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "command" or "execute" property.`
    );
  }
}

client.once(Events.ClientReady, (_client) => {
  console.log(`Ready! Logged in as ${_client.user.tag}`);
});
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }
  console.log("Interaction", interaction);
  const client = interaction.client as DiscordClient;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found`);
    return;
  }

  try {
    await command.execute();
  } catch (e) {
    console.error(e);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "Sorry, something went wrong while executing this command.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Sorry, something went wrong while executing this command.",
        ephemeral: true,
      });
    }
  }
});
