import mongoose from "mongoose";
import { Ranks } from "./enums/ranks";
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: {
      required: true,
      unique: true,
      type: String,
    },
    points: {
      required: true,
      type: Number,
      unique: false,
    },
    rank: {
      required: false,
      type: String,
      enum: Ranks,
      default: Ranks.unranked,
    },
    isAdmin: {
      required: false,
      type: Boolean,
      default: false,
    },
    discordId: {
      required: true,
      type: String,
    },
    // Is Tekken Master = root
    isTM: {
      required: false,
      type: Boolean,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
    toJSON: { virtuals: true, getters: true },
  }
);

const UserModal = mongoose.model("users", UserSchema);

UserSchema.index({ name: 1 }, { unique: true });
UserSchema.index({ points: 1 });

export default UserModal;
