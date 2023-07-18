import { TextChannel } from "discord.js";
import { ChannelIds } from "../models/enums/channelIDs";
import { DiscordClient } from "../types/client";
import { StringHelper } from "../helpers/String.helper";
import { MatchHelper } from "../helpers/match.helper";

export async function initScoreBoard(client: DiscordClient) {
  try {
    const channel = client.channels.cache.get(
      ChannelIds.scoreboardDev
    ) as TextChannel;
    const messages = await channel.messages.fetch({ limit: 1 });
    const scoreboardMessage = messages.first();

    if (!scoreboardMessage) {
      channel.send(StringHelper.buildScoreBoardMesssage(""));
      return;
    }

    channel.sendTyping();

    let content = await MatchHelper.getScoreBoardData();

    while (content.length) {
      const messagesArrayToBeSent = content.split("\n", 20).join("\n");
      content = content.slice(messagesArrayToBeSent.length);

      channel.send(`${"```cpp"}
${messagesArrayToBeSent}
${"```"}`);
    }
  } catch (e) {
    console.log("initScoreBoard error", e);
  }
}
