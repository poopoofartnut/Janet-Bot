import { Client, GatewayIntentBits, REST, Routes, Interaction, ActivityType } from 'discord.js';
import { getCommands, commandHandlers } from './commands/index';
import { DISCORD_TOKEN } from '../config';
import express, { Request, Response } from "express";
import axios from "axios";
import querystring from "querystring";
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from "../config";

const TOKEN = DISCORD_TOKEN;

// Register slash commands with Discord
async function registerCommands() {
    const commands = getCommands();
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageTyping
    ]
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const handler = commandHandlers[interaction.commandName];
    if (handler) {
        await handler(interaction);
    }
});

// Discord OAuth2 routes
const OAUTH_SCOPE = "identify guilds";
const DISCORD_API = "https://discord.com/api";
const router = express.Router();

router.get("/login", (req, res) => {
  const params = querystring.stringify({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: OAUTH_SCOPE,
  });
  res.redirect(`${DISCORD_API}/oauth2/authorize?${params}`);
});

router.get("/callback", async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send("No code provided");
    return;
  }

  // Exchange code for access token
  const data = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    scope: OAUTH_SCOPE,
  };

  try {
    const tokenRes = await axios.post(`${DISCORD_API}/oauth2/token`, querystring.stringify(data), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const accessToken = tokenRes.data.access_token;

    // Get user guilds
    const userGuildsRes = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userGuilds = userGuildsRes.data;

    // Get bot guilds
    const botGuildsRes = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bot ${TOKEN}` },
    });
    const botGuilds = botGuildsRes.data;

    // Find shared guilds
    const botGuildIds = new Set(botGuilds.map((g: any) => g.id));
    const sharedGuilds = userGuilds.filter((g: any) => botGuildIds.has(g.id));

    if (sharedGuilds.length > 0) {
      res.send("You own a server with the bot in it!");
    } else {
      res.send("You do not own any servers with the bot in it.");
    }
  } catch (err) {
    res.status(500).send("OAuth error: " + (err as Error).message);
  }
});

export async function startBot() {
    await registerCommands();
    await client.login(TOKEN);
    await client.user?.setActivity('I’m not a person. I’m a Janet', { type: ActivityType.Playing });
}


export async function stopBot() {
    await client.destroy();
}

export default router;