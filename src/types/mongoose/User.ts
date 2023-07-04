import { Ranks } from "../../models/enums/ranks";

export interface MongooseUser extends Document {
  isAdmin?: boolean;
  name: string;
  points: number;
  rank: Ranks;
  discordId: string;
  isTM?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
