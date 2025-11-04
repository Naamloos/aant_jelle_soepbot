import { Message, OmitPartialGroupDMChannel, PartialMessage } from "discord.js";
import { FuckAssMessageUpdateCallbackTypeFromDiscordJS } from "../@types";
import { client } from "..";
import { generateMotieImage } from "../util";

const pollEnded: FuckAssMessageUpdateCallbackTypeFromDiscordJS = 
async (
    oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage<boolean>>, 
    newMessage: OmitPartialGroupDMChannel<Message<boolean>>) => 
{
    console.log(JSON.stringify(newMessage));
    if(newMessage.poll?.resultsFinalized && newMessage.author?.id === client.user?.id) {
        const voorVotes = newMessage.poll.answers.find(option => option.text === "VOOR")?.voteCount ?? 0;
        const tegenVotes = newMessage.poll.answers.find(option => option.text === "TEGEN")?.voteCount ?? 0;

        const aangenomen = voorVotes > tegenVotes;

        const votersArrays = await Promise.all(
            newMessage.poll.answers.map(async (answer) => {
                const voteType: 'voor' | 'tegen' | 'onthouden' = 
                    answer.text === "VOOR" ? "voor" : 
                    answer.text === "TEGEN" ? "tegen" : "onthouden";
                
                const voterUsers = await answer.fetchVoters();
                return voterUsers.map(user => ({
                    name: user.displayName || user.username,
                    vote: voteType
                }));
            })
        );
        const voters = votersArrays.flat();

        const motieImage = await generateMotieImage({
            title: newMessage.poll.question.text!.replace(/^motie [^:]+: /, ""),
            proposer: newMessage.poll.question.text!.match(/^motie ([^:]+): /)?.[1] || "Onbekend",
            date: new Date(newMessage.createdAt),
            result: aangenomen ? "aangenomen" : "verworpen",
            voters: voters
        });

        await newMessage.reply({ files: [{ attachment: motieImage.buffer, name: 'motie-resultaat.png' }] });
    }
}

export default pollEnded;