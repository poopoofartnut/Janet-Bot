import dotenv from 'dotenv';
dotenv.config();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';
export const CLIENT_ID = process.env.CLIENT_ID || '';
export const PORT = process.env.PORT || 3000;
export const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/discord/callback';
export const CLIENT_SECRET = process.env.CLIENT_SECRET || '';