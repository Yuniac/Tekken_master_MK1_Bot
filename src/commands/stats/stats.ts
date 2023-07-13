import { MongooseUser } from "./../../types/mongoose/User";
import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";

import MatchModal from "../../models/match";

const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Gets a detailed run down of a player")
  .addUserOption((option) =>
    option
      .setName("name")
      .setDescription("The name of the player to get info about")
      .setRequired(true)
  );

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  const user = interaction.options.getUser("name");

  const [
    users,
    mognoUser,
    leaderboard,
    matchesWonByUser,
    matchesLostByUser,
    matchesUserWasIn,
  ] = await Promise.all([
    UserModal.find({ name: { $ne: user?.username } }).lean(),
    UserModal.findOne({ name: user?.username }).lean(),
    UserModal.find().sort({ points: 1 }).lean(),
    MatchModal.find({ winner: user?.username }).lean(),
    MatchModal.find({
      $and: [
        { winner: { $ne: user?.username } },
        {
          $or: [
            { player1Name: user?.username },
            { player2Name: user?.username },
          ],
        },
      ],
    }).lean(),
    MatchModal.find({
      $or: [{ player1Name: user?.username }, { player2Name: user?.username }],
    })
      .populate("player1 player2")
      .lean(),
  ]);

  if (!mognoUser || !user) {
    return interaction.reply(
      `Error: Looks like this user (**${user?.username}**) isn't registered yet. We have no info about them.`
    );
  }

  const generateLineOfData = (user: MongooseUser) => {
    const matches = matchesUserWasIn.filter((m) =>
      [m.player1Name, m.player2Name].includes(user.name)
    );

    if (!matches) {
      return;
    }

    const matchesVsOpponentIWon = matches.filter(
      (m) => m.winner === mognoUser.name
    );

    const name = mognoUser.name;
    const opponentName = user.name;
    const opponentPoints = user.points;
    const sets = matches.length;
    const score = `${matches.length}-${
      matches.length - matchesVsOpponentIWon.length
    }`;
    const winRate = (matchesVsOpponentIWon.length * 100) / matches.length;

    return `-${name} \t vs \t ${opponentName}(${opponentPoints}) \t S:${sets} \t Sc:${score} \t WinRate: %${winRate}
    
    \r`;
  };

  const stats = users.map((u) =>
    generateLineOfData(u as unknown as MongooseUser)
  );

  const name = mognoUser.name;
  const points = mognoUser.points;
  const leaderboardRank = leaderboard.findIndex(
    ({ name }) => name === user?.username
  );
  const sets = matchesWonByUser.length + matchesLostByUser.length;
  const wins = matchesWonByUser.length;
  const loses = matchesLostByUser.length;
  const winRate =
    (matchesWonByUser.length * 100) /
    (matchesWonByUser.length + matchesLostByUser.length);

  const message = `${"```cs"}
  Below are ${name}'s all time stats:

  #${leaderboardRank} ${name}. Points:${points}. Sets:${sets}   Wins:${wins}.   Loses:${loses}   Winrate: ${winRate}  
  ----------------------------------------------------------------------
  -Player \t vs \t Player(rating) \t Sets \t Score \t Winrate
  ----------------------------------------------------------------------

  
  ${stats.join()}


  
  
  ${"\r```"}`;
  interaction.reply(message);
};

export { data, execute };
