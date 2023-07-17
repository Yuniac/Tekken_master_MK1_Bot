import { TextChannel } from "discord.js";
import { ChannelIds } from "../models/enums/channelIDs";
import { DiscordClient } from "../types/client";
import { StringHelper } from "../helpers/String.helper";
import { MatchHelper } from "../helpers/match.helper";

export async function initScoreBoard(client: DiscordClient) {
  const channel = client.channels.cache.get(
    ChannelIds.scoreboardDev
  ) as TextChannel;
  const messages = await channel.messages.fetch({ limit: 1 });
  const scoreboardMessage = messages.first();

  if (!scoreboardMessage) {
    channel.send(StringHelper.buildScoreBoardMesssage(""));
    return;
  }

  scoreboardMessage.edit({
    content: await MatchHelper.getScoreBoardData(),
    options: {},
  });
}
