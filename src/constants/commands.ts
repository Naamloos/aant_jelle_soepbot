import { APIApplicationCommand, ApplicationCommand, ApplicationCommandOptionType, RESTPutAPIApplicationCommandsJSONBody } from "discord.js";

const Commands: RESTPutAPIApplicationCommandsJSONBody = [
    {
        name: "motie",
        description: "Doe een motie",
        options: [
            {
                name: "tekst",
                description: "De tekst van de motie",
                type: ApplicationCommandOptionType.String,
                required: true,
                max_length: 125
            }
        ]
    }
]

export default Commands;