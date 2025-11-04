import { Interaction } from "discord.js";
import motie from "./motie";

const interactionReceived = async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
            case "motie":
                motie(interaction);
                break;
            default:
                await interaction.reply({ content: "Huh wat is dit voor commando?", ephemeral: true });
                break;
        }
    }
}
export default interactionReceived;