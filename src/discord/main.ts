import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";
import path from "path";
import fs from "fs";
import { DiscordClient } from "../types/client";
import { DiscordRoles } from "../models/enums/discordRoles";
import UserModal from "../models/user";

export const initDiscord = () => {
  console.log("Welcome. Firing the bot up!");
  console.log("Loading...");

  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  }) as Client<boolean> & {
    commands: Map<string, { data: Function; execute: Function }>;
  };

  client.login(process.env.discord_token);

  client.commands = new Map();
  const rootCommandsDirPath = path.join(__dirname, "../commands");
  const commandFolders = fs.readdirSync(rootCommandsDirPath);

  for (const commandFolder of commandFolders) {
    const commandsPath = path.join(rootCommandsDirPath, commandFolder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".ts") && !file.startsWith("_"));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      console.log("Reading", filePath, "...");
      const command = require(filePath) as {
        data: Function;
        execute: Function;
      };

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "command" or "execute" property.`
        );
      }
    }
  }

  client.once(Events.ClientReady, (_client) => {
    console.log(`Ready! Logged in as ${_client.user.tag}`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const client = interaction.client as DiscordClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found`);
      interaction.reply(
        `Error: We couldn't understand **${interaction.commandName}**. This command is unknown`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (e) {
      console.error(e);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            "Error: Sorry, something went wrong while executing this command.",
        });
      } else {
        await interaction.reply({
          content:
            "Error: Sorry, something went wrong while executing this command.",
        });
      }
    }
  });

  client.on("guildMemberUpdate", (oldMember, newMember) => {
    const name = newMember.user.username;
    const wasMod = oldMember.roles.cache.find(
      (r) => r.name === DiscordRoles.mod
    );

    const isNowMod = newMember.roles.cache.find(
      (r) => r.name === DiscordRoles.mod
    );

    if (wasMod && !isNowMod) {
      UserModal.findOneAndUpdate({ name }, { $set: { isAdmin: false } });
    }

    if (isNowMod && !wasMod) {
      UserModal.findOneAndUpdate({ name }, { $set: { isAdmin: true } });
    }
  });

  return client;
};
