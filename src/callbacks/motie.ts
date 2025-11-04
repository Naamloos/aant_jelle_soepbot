import { APIInteractionGuildMember, ChatInputCommandInteraction, Interaction, RESTPostAPIChannelMessageJSONBody, Routes, User } from "discord.js";
import { restClient } from "..";
import { config } from "../config";

const buildMotiePoll = (motie: string, displayName: string): RESTPostAPIChannelMessageJSONBody => {
    return {
        poll: {
            question: {
                text: `motie ${displayName}: ${motie}`
            },
            answers: [
                { poll_media: { text: "VOOR" } },
                { poll_media: { text: "TEGEN" } }
            ],
            duration: 1,
        }
    };
}

const motie = async (interaction: ChatInputCommandInteraction) => {
    const motieText = interaction.options.getString("tekst", true);

    let displayName = interaction.user.username;
    if (interaction.guildId) {
        try {
            const apiMember = await restClient.get(
                Routes.guildMember(interaction.guildId, interaction.user.id)
            ) as APIInteractionGuildMember;
            displayName = apiMember?.nick ?? apiMember?.user?.username ?? displayName;
        } catch {
            // ignore and fall back to username
        }
    }

    await restClient.post(
        Routes.channelMessages(config.CHANNEL_ID),
        { body: buildMotiePoll(motieText, displayName) }
    );

    await interaction.reply({ content: `Uw motie is ingediend: \`\`\`${motieText.replace(/`/g, "\\`")}\`\`\`` });
}
export default motie;