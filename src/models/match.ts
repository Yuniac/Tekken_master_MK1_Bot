import mongoose from "mongoose";
import { MatchesKind } from "./enums/matchesKinds";
import UserModal from "./user";
import { Ranks } from "./enums/ranks";
const Schema = mongoose.Schema;

const MatchSchema = new Schema(
  {
    kind: {
      required: false,
      type: String,
      enum: MatchesKind,
      default: MatchesKind.bo5,
    },
    winner: {
      required: true,
      type: String,
    },
    pointsGained: {
      required: true,
      type: Number,
    },
    pointsLost: {
      required: true,
      type: Number,
    },
    player1Name: {
      requried: true,
      type: String,
    },
    player2Name: {
      requried: true,
      type: String,
    },
    player1Rank: {
      required: true,
      type: String,
      enum: Ranks,
    },
    player2Rank: {
      required: true,
      type: String,
      enum: Ranks,
    },
    season: {
      required: false,
      type: String,
      default: 1,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
    toJSON: { virtuals: true, getters: true },
  }
);

MatchSchema.virtual("player1", {
  ref: UserModal.name,
  localField: "player1",
  foreignField: "name",
});

MatchSchema.virtual("player2", {
  ref: UserModal.name,
  localField: "player2",
  foreignField: "name",
});

const MatchModal = mongoose.model("match", MatchSchema);

MatchSchema.index({ player1: 1 });
MatchSchema.index({ player2: 1 });

export default MatchModal;