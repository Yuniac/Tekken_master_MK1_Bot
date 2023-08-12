require("dotenv").config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env",
});
process.env.TZ = "Etc/GMT+3";

import cron from "node-cron";
import { initDiscord } from "./discord/main";
import mongoose from "mongoose";
import { MatchHelper } from "./helpers/match.helper";

const client = initDiscord();

client.on("ready", () => {
  // rehydrate, then schedule
  MatchHelper.rehydrateScoreBoardMessage(client);

  // Every 3 hours
  cron.schedule(
    "0 */3 * * *",
    () => {
      MatchHelper.rehydrateScoreBoardMessage(client);
    },
    { name: "Rehydrate ScoreBoard Message" }
  );
});

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DBACCESS!).then(({ connection }) => {
  console.log("Connected to the DB:", `'${connection.db.databaseName}'`);
});

process.on("uncaughtException", function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});
