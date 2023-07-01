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
}
