import {
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  EmbedField,
} from "discord.js";
import { capitalize } from "lodash";

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
      title: string;
      description: string;
      fields?: EmbedField[];
    },
    interaction: ChatInputCommandInteraction<CacheType>
  ) {
    const { title, description, fields } = arg;

    return new EmbedBuilder()
      .setAuthor({
        name: "Tekken Master Bot",
        iconURL: interaction.client.user.avatarURL() || "",
      })
      .setColor("#9B59B6")
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: "Tekken Master MK1 Ladder bot." })
      .addFields(fields || []);
  }
}
