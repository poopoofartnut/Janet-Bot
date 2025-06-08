import { Router, Request } from 'express';
import { renderLogs, modifyCommands } from '../controllers/index';
import axios from 'axios';
import { getLogsForGuild } from '../../bot/utils/commandLogger';

// Add this import if you use express-session
import session from 'express-session';

// Extend Express Request interface to include session
declare module 'express-session' {
    interface SessionData {
        accessToken?: string;
        userGuilds?: any; // Add this line to fix the error
        // add other session properties if needed
    }
}

const router = Router();

// Discord OAuth2 config
const CLIENT_ID = process.env.CLIENT_ID || '';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/discord/callback';
const OAUTH_SCOPE = 'identify guilds';

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/auth/discord', (req, res) => {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: OAUTH_SCOPE
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

router.get('/callback', async (req, res) => {
    const code = req.query.code as string;
    if (!code) {
        res.status(400).send('No code provided');
        return;
    }

    // Exchange code for access token
    const params = new URLSearchParams();
    params.append('client_id', process.env.CLIENT_ID!);
    params.append('client_secret', process.env.CLIENT_SECRET!);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', process.env.REDIRECT_URI!);
    params.append('scope', 'identify guilds');

    try {
        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const accessToken = tokenRes.data.access_token;

        // Save access token to session
        req.session.accessToken = accessToken;

        // Get user's guilds
        const userGuildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userGuilds = userGuildsRes.data;

        // Save userGuilds to session
        req.session.userGuilds = userGuilds;

        // Get bot's guilds
        const botGuildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }
        });
        const botGuilds = botGuildsRes.data;

        // Find guilds the user owns
        const ownedGuilds = userGuilds.filter((g: any) => g.owner);

        // Check if any owned guild is also in bot's guilds
        const botGuildIds = new Set(botGuilds.map((g: any) => g.id));
        const ownsGuildWithBot = ownedGuilds.some((g: any) => botGuildIds.has(g.id));

        if (ownsGuildWithBot) {
            // res.send('You own a server with the bot in it!');
            res.redirect('/logs');
        } else {
            // res.send('You do NOT own a server with the bot in it.');
            res.redirect('/logs');
        }
    } catch (err: any) {
        if (err.response) {
            res.status(500).send(
                'OAuth2 error: ' +
                err.response.status +
                ' - ' +
                JSON.stringify(err.response.data)
            );
        } else {
            res.status(500).send('OAuth2 error: ' + err.message);
        }
    }
});

// Helper to check for Administrator permission (0x8)
function hasAdministrator(permissions: string | number) {
    // Discord permissions are bitfields, admin is 0x8
    return (BigInt(permissions) & BigInt(8)) === BigInt(8);
}

// Route to get logs for each server where user has Administrator
async function getUsername(userId: string, botToken: string) {
    try {
        const res = await axios.get(`https://discord.com/api/users/${userId}`, {
            headers: { Authorization: `Bot ${botToken}` }
        });
        return res.data.username + '#' + res.data.discriminator;
    } catch {
        return userId; // fallback to ID if fetch fails
    }
}

router.get('/logs', async (req, res) => {
    const accessToken = req.session?.accessToken;
    if (!accessToken) {
        return res.redirect('/login');
    }

    const userGuilds = req.session?.userGuilds;
    if (!userGuilds) {
        return res.redirect('/login');
    }

    try {
        // Filter guilds where user has Administrator
        const adminGuilds = userGuilds.filter((g: any) => hasAdministrator(g.permissions));

        const botToken = process.env.DISCORD_TOKEN!;
        const usernamesById: Record<string, string> = {};

        // Collect all unique userIds from logs
        const allUserIds = new Set<string>();
        for (const guild of adminGuilds) {
            const logs = await getLogsForGuild(guild.id);
            logs.forEach((log: any) => allUserIds.add(log.userId));
        }

        // Fetch usernames for all userIds
        await Promise.all(Array.from(allUserIds).map(async userId => {
            usernamesById[userId] = await getUsername(userId, botToken);
        }));

        // Build logsByGuild as before
        const logsByGuild: Record<string, any[]> = {};
        for (const guild of adminGuilds) {
            logsByGuild[guild.name] = await getLogsForGuild(guild.id);
        }

        res.render('logs', { logsByGuild, usernamesById });
    } catch (err: any) {
        res.status(500).send('Error fetching logs: ' + err.message);
    }
});

// Route to manage commands
router.post('/commands', modifyCommands);

router.get('/', (req, res) => {
    res.render('index', { clientId: process.env.CLIENT_ID });
});

export default router;