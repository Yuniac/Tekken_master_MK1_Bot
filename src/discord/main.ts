import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Events,
  Partials,
  Collection,
} from "discord.js";
import path from "path";
import fs from "fs";
import { DiscordClient } from "../types/client";
import { DiscordRoles } from "../models/enums/discordRoles";
import UserModal from "../models/user";

export const initDiscord = () => {
  console.log("Welcome. Firing the bot up!");
  console.log("Loading...");

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.GuildMember],
  }) as DiscordClient;

  client.coolDowns = new Collection();

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
    const command = client.commands.get(interaction.commandName) as
      | {
          data: Function;
          execute: Function;
          cooldown?: number;
        }
      | undefined;

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found`);
      interaction.reply(
        `Error: We couldn't understand **${interaction.commandName}**. This command is unknown`
      );
      return;
    }

    const cooldowns = client.coolDowns;

    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name) as any;
    const defaultCooldownDuration = 3;
    const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id) + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        const message = await interaction.reply({
          content: `Please wait, you are on a cooldown for \`${
            command.data.name
          }\`. You can use it again ${
            expiredTimestamp >= 0 ? `<t:${expiredTimestamp}:R>.` : "now"
          }`,
          ephemeral: true,
        });

        setTimeout(() => {
          message.delete();
        }, cooldownAmount);

        return;
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

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

  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const name = newMember.user.username;
    const wasMod = oldMember.roles.cache.find(
      (r) => r.name === DiscordRoles.mod
    );

    const isNowMod = newMember.roles.cache.find(
      (r) => r.name === DiscordRoles.mod
    );

    if (wasMod && !isNowMod) {
      await UserModal.updateOne({ name }, { isAdmin: false });
    }

    if (isNowMod && !wasMod) {
      await UserModal.updateOne({ name }, { isAdmin: true });
    }
  });

  return client;
};
