import { APIApplicationCommand, ApplicationCommand, ApplicationCommandOptionType, PermissionFlagsBits, RESTPutAPIApplicationCommandsJSONBody } from "discord.js";

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
    },
    {
        name: "motie-van-wantrouwen",
        description: "Forceer het beëindigen van een motie poll",
        options: [
            {
                name: "message-id",
                description: "Het bericht ID van de poll om te beëindigen",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ],
        default_member_permissions: PermissionFlagsBits.ManageMessages.toString()
    }
]

export default Commands;