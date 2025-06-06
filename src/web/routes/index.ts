import { Router } from 'express';
import { renderLogs, modifyCommands } from '../controllers/index';

const router = Router();

// Discord OAuth2 config
const CLIENT_ID = process.env.CLIENT_ID || '';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/discord/callback';
const OAUTH_SCOPE = 'identify';

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

// TODO: Implement the callback handler for /auth/discord/callback

// Route to get logs
router.get('/logs', renderLogs);

// Route to manage commands
router.post('/commands', modifyCommands);

export default router;