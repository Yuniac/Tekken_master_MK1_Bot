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

    channel.sendTyping();

    let content = StringHelper.buildScoreBoardMesssage(
      await MatchHelper.getScoreBoardData()
    );

    while (content.length) {
      const messagesArrayToBeSent = content.split("\n", 20).join("\n");
      console.log(messagesArrayToBeSent);
      content = content.slice(messagesArrayToBeSent.length);

      channel.send(`${"```cpp"}
${messagesArrayToBeSent}
${"```"}`);
    }
  } catch (e) {
    console.log("initScoreBoard error", e);
  }
}
