require("dotenv").config({
  path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env",
});

import { initDiscord } from "./discord/main";
import mongoose from "mongoose";

initDiscord();

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DBACCESS!).then(({ connection }) => {
  console.log("Connected to the DB:", `'${connection.db.databaseName}'`);
});
