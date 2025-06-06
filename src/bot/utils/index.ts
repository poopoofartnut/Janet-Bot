import { Client, GatewayIntentBits } from 'discord.js';

export function createClient() {
    return new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ]
    });
}

export function logMessage(message: string) {
    console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
}

export function validateCommand(command: string): boolean {
    const validCommands = ['ping', 'help']; // Example valid commands
    return validCommands.includes(command);
}