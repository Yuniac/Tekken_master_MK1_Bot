import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
  userMention,
} from "discord.js";
import UserModal from "../../models/user";
import MatchModal from "../../models/match";
import { MatchHelper } from "../../helpers/match.helper";
import { MongooseUser } from "../../types/mongoose/User";
import { StringHelper } from "../../helpers/String.helper";

const data = new SlashCommandBuilder()
  .setName("m-admin")
  .setDescription("Register a lose of a BO5 as an admin")
  .addUserOption((option) =>
    option.setName("winner").setDescription("The winner").setRequired(true)
  )
  .addUserOption((option) =>
    option.setName("loser").setDescription("The loser").setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("winner-score")
      .setDescription("The score of the winner. e.g: 3")
      .setMinValue(0)
  )
  .addIntegerOption((option) =>
    option
      .setName("loser-score")
      .setDescription("The score of the loser. e.g: 2")
      .setMaxValue(5)
  );

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.deferReply();

  const admin = await UserModal.findOne({
    name: interaction.user.username,
  }).lean();

  if (!admin || (admin && admin.isAdmin === false)) {
    return interaction.followUp(
      `Error. This command is only available for admins`
    );
  }

  const winner = interaction.options.getUser("winner");
  const loser = interaction.options.getUser("loser");
  const winnersScrore = interaction.options.getInteger("winner-score");
  const losersScore = interaction.options.getInteger("loser-score");

  if (!winner || !loser) {
    return interaction.followUp(
      "Error: Sorry, someting went wrong and we can't process the winner, or the loser info at this time. Make sure both players are registered before using this command"
    );
  }

  if ([winner.username, loser.username].includes(admin.name)) {
    return interaction.followUp(
      "Error: as an admin using this command, you can only report other players results. To report a set you lost, use **/m**."
    );
  }

  const mongoWinner = (await UserModal.findOne({
    name: winner.username,
  })) as MongooseUser;
  const mongoLoser = (await UserModal.findOne({
    name: loser.username,
  })) as MongooseUser;

  if (!mongoWinner) {
    return interaction.followUp(
      `Error: player **${winner.username}** isn't registered. Players have to be registered before winning or losing a set. To register yourself, use **/reg**.`
    );
  }

  if (!mongoLoser) {
    return interaction.followUp(
      `Error: player **${loser.username}** isn't registered. Players have to be registered before winning or losing a set. To register yourself, use **/reg**.`
    );
  }

  const [winnerDiffPoints, loserDiffPoints] =
    MatchHelper.calculateNewPointsOfWinnerAndLoser(mongoWinner, mongoLoser);

  const pointsWon = winnerDiffPoints - mongoWinner.points;
  const pointsLost = loserDiffPoints - mongoLoser.points;

  try {
    const [_, __, ___] = await Promise.all([
      MatchModal.create({
        winner: winner.username,
        player1Name: winner.username,
        player2Name: loser.username,
        pointsGained: pointsWon,
        pointsLost: pointsLost,
        player1Rank: mongoWinner.rank,
        player2Rank: mongoLoser.rank,
      }),
      UserModal.findOneAndUpdate(
        { name: winner.username },
        { $inc: { points: pointsWon } }
      ),
      UserModal.findOneAndUpdate(
        { name: loser.username },
        { $inc: { points: pointsLost } }
      ),
    ]);

    const [updatedWinner, updatedLoser] = await Promise.all([
      UserModal.findOne({ name: winner.username }),
      UserModal.findOne({ name: loser.username }),
    ]);

    if (updatedWinner) {
      MatchHelper.CheckIfPlayerHasRankedUpOrDown(
        updatedWinner.name,
        interaction,
        winner
      );
    }

    if (updatedLoser) {
      MatchHelper.CheckIfPlayerHasRankedUpOrDown(
        updatedLoser.name,
        interaction,
        loser
      );
    }

    StringHelper.sendNotificationToBattleLogChannel(
      updatedWinner as unknown as MongooseUser,
      updatedLoser as unknown as MongooseUser,
      pointsWon,
      pointsLost,
      winnersScrore,
      losersScore,
      interaction
    );
    const channel = interaction.client.channels.cache.get(
      interaction.channelId
    ) as TextChannel;

    await interaction.followUp("Set recorded!");

    channel.send(
      `**${userMention(winner.id)}** ${
        updatedWinner?.points
      }(+${pointsWon}) defeated **${userMention(loser.id)}** ${
        updatedLoser?.points
      }(${pointsLost}) in a best of 5 set${
        MatchHelper.canDisplayScores(winnersScrore, losersScore)
          ? ` (${winnersScrore}-${losersScore})`
          : ""
      }. This set was registered by admin **${userMention(
        interaction.user.id
      )}**, GGs`
    );
  } catch (e: any) {
    console.log(e);
    interaction.followUp(
      `Error: Sorry, something went wrong while storing your user data. Share this error with our developers to help you: "${e}"`
    );
  }
};

export { data, execute };
