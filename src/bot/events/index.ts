import { Client } from 'discord.js';
import { startBot } from '../bot';

export const onReady = (client: Client) => {
    console.log(`Logged in as ${client.user?.tag}!`);
};

export const onInteractionCreate = async (interaction: any) => {
    if (!interaction.isChatInputCommand()) return;
    // Handle command interactions here
};