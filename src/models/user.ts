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
    },
    rank: {
      required: false,
      type: Ranks,
    },
    isAdmin: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
    toJSON: { virtuals: true, getters: true },
  }
);

const UserModal = mongoose.model("user", UserSchema);

UserSchema.index({ name: 1 }, { unique: true });

export default UserModal;
