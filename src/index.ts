require("dotenv").config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env",
});

import cron from "node-cron";
import { initDiscord } from "./discord/main";
import mongoose from "mongoose";
import { initScoreBoard } from "./discord/scoreboard";
import { MatchHelper } from "./helpers/match.helper";

const client = initDiscord();

client.on("ready", () => {
  // rehydrate, then schedule
  MatchHelper.rehydrateScoreBoardMessage(client);

  // Every 6 hours
  cron.schedule("0 0 * * *", () => {
    MatchHelper.rehydrateScoreBoardMessage(client);
  });
});

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DBACCESS!).then(({ connection }) => {
  console.log("Connected to the DB:", `'${connection.db.databaseName}'`);
});

process.on("uncaughtException", function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});
