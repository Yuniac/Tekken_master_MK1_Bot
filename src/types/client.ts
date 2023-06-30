import { Client } from "discord.js";

export type DiscordClient = Client<boolean> & {
  commands: Map<string, { data: Function; execute: Function }>;
};
