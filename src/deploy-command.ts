import "dotenv/config";

import { REST, Routes } from "discord.js";
import path from "path";
import fs from "fs";

const commands = [];
// Grab all the command files from the commands directory you created earlier
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts") && !file.startsWith("_"));

  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

const api = new REST().setToken(process.env.discord_token!);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = await api.put(
      Routes.applicationGuildCommands(
        process.env.clientId!,
        process.env.guildId!
      ),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${(data as any).length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
