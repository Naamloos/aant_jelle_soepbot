import { Message, OmitPartialGroupDMChannel, PartialMessage } from "discord.js";
import { FuckAssMessageUpdateCallbackTypeFromDiscordJS } from "../@types";
import { client } from "..";

const pollEnded: FuckAssMessageUpdateCallbackTypeFromDiscordJS = 
async (
    oldMessage: OmitPartialGroupDMChannel<Message<boolean> | PartialMessage<boolean>>, 
    newMessage: OmitPartialGroupDMChannel<Message<boolean>>) => 
{
    if(newMessage.poll?.resultsFinalized && newMessage.author?.id === client.user?.id) {
        const voorVotes = newMessage.poll.answers.find(option => option.text === "VOOR")?.voteCount ?? 0;
        const tegenVotes = newMessage.poll.answers.find(option => option.text === "TEGEN")?.voteCount ?? 0;

        const aangenomen = voorVotes > tegenVotes;

        await newMessage.reply(`De motie is: ${aangenomen ? "aangenomen" : "verworpen"} met ${voorVotes} stemmen voor en ${tegenVotes} stemmen tegen.`);
    }
}

export default pollEnded;