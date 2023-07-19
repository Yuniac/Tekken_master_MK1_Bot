import { Client, Collection } from "discord.js";

export type DiscordClient = Client<boolean> & {
  commands: Map<string, { data: Function; execute: Function }>;
  coolDowns: Collection<unknown, unknown>;
};
