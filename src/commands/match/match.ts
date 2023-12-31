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
  .setName("m")
  .setDescription("Register a lose of a BO5")
  .addUserOption((option) =>
    option
      .setName("winner")
      .setDescription("The user who played and won against you")
      .setRequired(true)
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

  const user = interaction.user;
  const opponent = interaction.options.getUser("winner");
  const winnersScrore = interaction.options.getInteger("winner-score");
  const losersScore = interaction.options.getInteger("loser-score");

  if (!user || !opponent) {
    return interaction.followUp(
      "Error: Sorry, someting went wrong and we can't process your user info or your opponents at this time. Make sure both players are registered before using this command"
    );
  }

  if (user.id === opponent.id) {
    return interaction.followUp(
      "Error: You can't report yourself as a winner. Reporting is done by the loser. For help, contact the moderators"
    );
  }

  const existingUser = (await UserModal.findOne({
    name: user.username,
  })) as MongooseUser;
  const existingOpponent = (await UserModal.findOne({
    name: opponent.username,
  })) as MongooseUser;

  if (!existingUser) {
    return interaction.followUp(
      `Error: You aren't registered, and you can't use this command before registering. Register yourself first by doing /reg then report the match.`
    );
  }

  if (!existingOpponent) {
    return interaction.followUp(
      `Error: Your oppoennt **${opponent.username}** isn't a registered member. Have them register themselves first, then report the result of the match.`
    );
  }

  const [winnerDiffPoints, loserDiffPoints] =
    MatchHelper.calculateNewPointsOfWinnerAndLoser(
      existingOpponent,
      existingUser
    );

  const pointsWon = winnerDiffPoints - existingOpponent.points;
  const pointsLost = loserDiffPoints - existingUser.points;

  try {
    const [_, __, ___] = await Promise.all([
      MatchModal.create({
        winner: opponent.username,
        player1Name: opponent.username,
        player2Name: user.username,
        pointsGained: pointsWon,
        pointsLost: pointsLost,
        player1Rank: existingOpponent.rank,
        player2Rank: existingUser.rank,
      }),
      UserModal.findOneAndUpdate(
        { name: opponent.username },
        { $inc: { points: pointsWon } }
      ),
      UserModal.findOneAndUpdate(
        { name: user.username },
        { $inc: { points: pointsLost } }
      ),
    ]);

    const [updatedWinner, updatedLoser] = await Promise.all([
      UserModal.findOne({ name: opponent.username }),
      UserModal.findOne({ name: user.username }),
    ]);

    if (updatedWinner) {
      MatchHelper.CheckIfPlayerHasRankedUpOrDown(
        updatedWinner.name,
        interaction,
        opponent
      );
    }

    if (updatedLoser) {
      MatchHelper.CheckIfPlayerHasRankedUpOrDown(
        updatedLoser.name,
        interaction,
        user
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
      `**${userMention(opponent.id)}** ${
        updatedWinner?.points
      }(+${pointsWon}) defeated **${userMention(user.id)}** ${
        updatedLoser?.points
      }(${pointsLost}) in a best of 5 set${
        MatchHelper.canDisplayScores(winnersScrore, losersScore)
          ? ` (${winnersScrore}-${losersScore})`
          : ""
      }, GGs`
    );
  } catch (e: any) {
    console.log(e);
    interaction.followUp(
      `Error: Sorry, something went wrong while storing your user data. Share this error with our developers to help you: "${e}"`
    );
  }
};

const cooldown = 10;

export { data, execute, cooldown };
