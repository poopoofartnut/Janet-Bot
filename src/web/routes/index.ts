import { Router } from 'express';
import { renderLogs, modifyCommands } from '../controllers/index';
import axios from 'axios';

const router = Router();

// Discord OAuth2 config
const CLIENT_ID = process.env.CLIENT_ID || '';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/discord/callback';
const OAUTH_SCOPE = 'identify+guilds';

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

        // Get user's guilds
        const userGuildsRes = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userGuilds = userGuildsRes.data;

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
            res.send('You own a server with the bot in it!');
        } else {
            res.send('You do NOT own a server with the bot in it.');
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

// Route to get logs
router.get('/logs', renderLogs);

// Route to manage commands
router.post('/commands', modifyCommands);

export default router;