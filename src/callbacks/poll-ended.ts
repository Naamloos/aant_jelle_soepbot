import { APIPollAnswer, Message, MessageType, OmitPartialGroupDMChannel, PartialMessage, Routes, User } from "discord.js";
import { FuckAssMessageUpdateCallbackTypeFromDiscordJS } from "../@types";
import { client, restClient } from "..";
import { generateMotieImage, Voter } from "../util";
import { config } from "../config";

const pollEnded: FuckAssMessageUpdateCallbackTypeFromDiscordJS =
    async (
    message: OmitPartialGroupDMChannel<Message<boolean>>) => {
    if (message.type !== MessageType.PollResult) {
        return; // Not a poll result message
    }
    if(message.channelId !== config.CHANNEL_ID) {
        return; // Not in the configured channel
    }
    if(message.author?.id !== client.user?.id) {
        return; // Not sent by the bot itself
    }

    const pollMessage = await message.fetchReference();
    const voorAnswerId = pollMessage.poll?.answers.find(answer => answer.text === "VOOR")?.id ?? 0;
    const tegenAnswerId = pollMessage.poll?.answers.find(answer => answer.text === "TEGEN")?.id ?? 0;
    const voorAnswers = await restClient.get(Routes.pollAnswerVoters(pollMessage.channelId, pollMessage.id, voorAnswerId)) as {users: User[]};
    const tegenAnswers = await restClient.get(Routes.pollAnswerVoters(pollMessage.channelId, pollMessage.id, tegenAnswerId)) as {users: User[]};

    const voorVotes = voorAnswers.users.length;
    const tegenVotes = tegenAnswers.users.length;
    const aangenomen = voorVotes > tegenVotes;

    const voorVoters = await Promise.all(voorAnswers.users.map(async (user): Promise<Voter> => {
        const member = await message.guild!.members.fetch(user.id);
        return {
            name: member.displayName || member.user.username,
            vote: 'voor' as const
        };
    }));

    const tegenVoters = await Promise.all(tegenAnswers.users.map(async (user): Promise<Voter> => {
        const member = await message.guild!.members.fetch(user.id);
        return {
            name: member.displayName || member.user.username,
            vote: 'tegen' as const
        };
    }));

    const voters = [...voorVoters, ...tegenVoters];

    const motieImage = await generateMotieImage({
        title: pollMessage.poll!.question.text!.replace(/^motie [^:]+: /, ""),
        proposer: pollMessage.poll!.question.text!.match(/^motie ([^:]+): /)?.[1] || "Onbekend",
        date: new Date(message.createdAt),
        result: aangenomen ? "aangenomen" : "verworpen",
        voters: voters
    });

    await message.reply({ files: [{ attachment: motieImage.buffer, name: 'motie-resultaat.png' }] });

}

export default pollEnded;