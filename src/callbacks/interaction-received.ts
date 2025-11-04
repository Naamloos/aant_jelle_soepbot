import { Interaction, Routes } from "discord.js";
import motie from "./motie";
import { restClient } from "..";

const interactionReceived = async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
            case "motie":
                motie(interaction);
                break;
            case "motie-van-wantrouwen":
                // check if message is owned by bot...
                const messageId = interaction.options.getString("message-id", true);
                const message = await interaction.channel?.messages.fetch(messageId);
                if (!message || message.author.id !== interaction.client.user?.id) {
                    return await interaction.reply({ content: "Ik kan alleen mijn eigen polls beëindigen.", ephemeral: true });
                }
                await interaction.reply({ content: "Ophoepelen...", ephemeral: true });
                restClient.post(Routes.expirePoll(interaction.channelId!, messageId));
                break;
            default:
                await interaction.reply({ content: "Huh wat is dit voor commando?", ephemeral: true });
                break;
        }
    }
}
export default interactionReceived;