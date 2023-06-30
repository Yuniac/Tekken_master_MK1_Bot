import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";

console.log("Welcome. Firing up!");
console.log("Loading...");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (_client) => {
  console.log(`Ready! Logged in as ${_client.user.tag}`);
});

client.login(process.env.discord_token);
