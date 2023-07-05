import { format } from "date-fns";
import { MongooseUser } from "../types/mongoose/User";
import { StringHelper } from "./String.helper";

export class PlayerHelper {
  static getInfo(
    user: MongooseUser,
    other?: { matchesCount?: number; winRate: number },
    self?: boolean
  ) {
    const { discordId, points, rank, createdAt, isAdmin, name } = user;
    const { winRate, matchesCount } = other || {};

    return `
    ${
      self
        ? `Hey, **${name}**. ${isAdmin ? `You are an admin.` : ""}`
        : `Here's the info that we know about **${name}**:`
    }

    -Points: **${points}**
    -Rank: **${StringHelper.humanize(rank)}**
    -Registered at: **${format(new Date(createdAt), "dd-MM-Y")}**
    -Sets played: **${matchesCount}**
    ${winRate ? `-Win rate: **${Math.round(winRate!)}%**` : ""}
  `;
  }
}
