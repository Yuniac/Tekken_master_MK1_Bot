import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  EmbedField,
  TextChannel,
  User,
  userMention,
} from "discord.js";
import { capitalize } from "lodash";
import { MatchHelper } from "./match.helper";
import { format } from "date-fns";
import { ChannelIds } from "../models/enums/channelIDs";
import { MongooseUser } from "../types/mongoose/User";
import { formatInTimeZone } from "date-fns-tz";
import enGB from "date-fns/locale/en-GB";

export class StringHelper {
  static humanize(str: string) {
    if (!str) {
      return "";
    }

    const symbols = /_/;
    const target = str;

    const flag = new RegExp(symbols, "g");

    return target
      .replace(flag, " ")
      .split(" ")
      .map((word) => capitalize(word))
      .join(" ");
  }

  static buildEmebd(
    arg: {
      title?: string;
      description?: string;
      fields?: EmbedField[];
    },
    interaction: ChatInputCommandInteraction<CacheType>
  ) {
    const { title, description, fields } = arg;

    const builder = new EmbedBuilder()
      .setAuthor({
        name: "Tekken Master Bot",
        iconURL: interaction.client.user.avatarURL() || "",
      })
      .setColor("#9B59B6")
      .addFields(fields || []);

    if (title) {
      builder.setTitle(title);
    }

    if (description) {
      builder.setDescription(description);
    }

    // if (footer) {
    //    builder.setFooter({ text: "Tekken Master MK1 Ladder bot." })
    // }

    return builder;
  }

  static sendNotificationToBattleLogChannel(
    winner: MongooseUser,
    loser: MongooseUser,
    pointsWon: number,
    pointsLost: number,
    winnerScore: number | null,
    loserScore: number | null,
    interaction: ChatInputCommandInteraction<CacheType>
  ) {
    const battleLogChannel = interaction.client.channels.cache.get(
      ChannelIds.battleLog
    );

    if (battleLogChannel) {
      const channel = battleLogChannel as TextChannel;
      channel.sendTyping();

      const date = formatInTimeZone(
        new Date(),
        "Etc/GMT-3",
        "dd/MM HH:mm zzz",
        {
          locale: enGB,
        }
      );

      const description = `**${winner.name}** (${winner.points}) +${pointsWon} defeated **${loser.name}** (${loser.points}) ${pointsLost}

      ${date}
      `;

      const builderArg: Partial<{
        title: string;
        description: string;
        fields?: EmbedField[];
      }> = {
        description,
      };

      if (MatchHelper.canDisplayScores(winnerScore, loserScore)) {
        builderArg["fields"] = [
          {
            name: `${winner.name}'s score:`,
            value: String(winnerScore),
            inline: true,
          },
          {
            name: `${loser.name}'s score:`,
            value: String(loserScore),
            inline: true,
          },
        ];
      }

      const message = StringHelper.buildEmebd(builderArg, interaction);

      channel.send({ embeds: [message] });
    }
  }

  static sendRankChangedMessage(
    player: MongooseUser,
    direction: "up" | "down",
    interaction: ChatInputCommandInteraction<CacheType>,
    user: User
  ) {
    const battleLogChannel = interaction.client.channels.cache.get(
      ChannelIds.battleLog
    );

    if (battleLogChannel) {
      const channel = battleLogChannel as TextChannel;
      channel.sendTyping();

      const text = `${format(new Date(), "dd-MM-Y K:a")}
      
      **Hey, ${
        player.name
      }** you have ranked ${direction}. Your new rank is: **${this.humanize(
        player.rank
      )}**`;

      const builderArg: {
        title: string;
        description: string;
        fields: EmbedField[];
      } = {
        title: "Rank update:",
        description: text,
        fields: [
          {
            name: `Player`,
            value: userMention(user.id),
            inline: false,
          },
        ],
      };

      const message = StringHelper.buildEmebd(builderArg, interaction);

      channel.send({ embeds: [message] });
    }
  }

  static buildScoreBoardMesssage(data: string) {
    if (!data.length) {
      return `Welcome to the scoreboard (Powerd by Tekken Master Leaderboard bot. Refreshes every 3 hours). 
      
Once there is data available, we will make sure to display it here!
`;
    }

    const date = formatInTimeZone(new Date(), "Etc/GMT-3", "HH:mm zzz", {
      locale: enGB,
    });

    const message = `
The scoreboard (Powerd by Tekken Master Leaderboard bot. Refreshes every 6 hours. Last refresh was ${date})

${data}    
`;

    return message;
  }
}
