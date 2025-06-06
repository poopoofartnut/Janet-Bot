import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export function getCommands() {
    return [
        new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Replies with Pong!')
            .toJSON(),
        // Add more commands here
    ];
}

// Map command names to their handler functions
export const commandHandlers: { [key: string]: (interaction: ChatInputCommandInteraction) => Promise<void> } = {
    ping: async (interaction) => {
        await interaction.reply('Pong!');
    },
    // Add more handlers here
};