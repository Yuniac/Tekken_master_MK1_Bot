import {
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import UserModal from "../../models/user";
import { MatchHelper } from "../../helpers/match.helper";
import { MongooseUser } from "../../types/mongoose/User";
import { StringHelper } from "../../helpers/String.helper";

const data = new SlashCommandBuilder()
  .setName("calc")
  .setDescription(
    "Calculate the point that can be obtained after a set with a player"
  )
  .addUserOption((option) =>
    option
      .setName("opponent")
      .setDescription("The opponent name")
      .setRequired(true)
  );

const execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
  await interaction.deferReply();

  const opponent = interaction.options.getUser("opponent");
  const user = interaction.user;

  if (!user || !opponent) {
    return interaction.followUp(
      "Error: Sorry, someting went wrong and we can't process this user at this time."
    );
  }

  try {
    const [mongoUser, mongoOpponent] = await Promise.all([
      UserModal.findOne({ name: user.username }),
      UserModal.findOne({ name: opponent.username }),
    ]);

    if (!mongoUser) {
      return interaction.followUp(
        `Error: There's no registered user with the name **${user.username}**. User must be registered before you can calculate your points against them.`
      );
    }

    if (!mongoOpponent) {
      return interaction.followUp(
        `Error: There's no registered user with the name **${opponent.username}**. User must be registered before you can calculate your points against them.`
      );
    }

    const ifPlayerWins = MatchHelper.calculateNewPointsOfWinnerAndLoser(
      mongoUser as unknown as MongooseUser,
      mongoOpponent as unknown as MongooseUser
    );

    const ifPlayerLoses = MatchHelper.calculateNewPointsOfWinnerAndLoser(
      mongoOpponent as unknown as MongooseUser,
      mongoUser as unknown as MongooseUser
    );

    const message = StringHelper.buildEmebd(
      {
        title: "Match preview:",
        description: `VS **${opponent.username}** (${mongoOpponent.points} points):`,
        fields: [
          {
            name: "If you win a set:",
            value: `+${String(ifPlayerWins[0] - mongoUser.points)} points`,
            inline: false,
          },
          {
            name: "If you lose a set:",
            value: `${String(mongoOpponent.points - ifPlayerLoses[0])} points`,
            inline: false,
          },
        ],
      },
      interaction
    );

    interaction.followUp({ embeds: [message] });
  } catch (e: any) {
    console.log(e);
    interaction.followUp(
      `Error: Sorry, something went wrong while storing your user data. Share this error with our developers to help you: "${e}"`
    );
  }
};

export { data, execute };
