import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "./config";
import Commands from "./constants/commands";
import interactionReceived from "./callbacks/interaction-received";
import pollEnded from "./callbacks/poll-ended";

export const client = new Client({ intents: [GatewayIntentBits.GuildMessagePolls, GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
export const restClient = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

client.on(Events.ClientReady, _ => {
    restClient.put(Routes.applicationCommands(config.DISCORD_CLIENT_ID), { body: Commands })
    console.log(`Logged in as ${client.user?.tag} (JA HOOR WE ZIJN LIJF)`);
})

client.on(Events.InteractionCreate, interactionReceived);

client.on(Events.MessageCreate, pollEnded);

client.login(config.DISCORD_TOKEN);