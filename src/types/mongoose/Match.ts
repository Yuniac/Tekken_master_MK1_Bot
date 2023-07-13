import { ObjectId } from "mongoose";
import { Ranks } from "../../models/enums/ranks";
import { MongooseUser } from "./User";

export interface MongoMatch extends Document {
  _id: ObjectId;
  kind: string;
  winner: string;
  pointsGained: number;
  pointsLost: number;
  player1Name: string;
  player2Name: string;
  player1Rank: Ranks;
  player2Rank: Ranks;
  season: string;
  createdAt: Date;
  updatedAt: Date;

  player1?: MongooseUser;
  player2?: MongooseUser;
}
