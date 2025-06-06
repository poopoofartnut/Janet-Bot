import path from 'path';

// Discord Bot Portal imports
import { startBot as startDiscordBot } from './src/bot/bot';
import express from 'express';
import { json } from 'body-parser';
import router from './src/web/routes/index';

// --- Discord Bot Startup ---
(async () => {
    try {
        await startDiscordBot();
        console.log('Discord bot started successfully.');
    } catch (err) {
        console.error('Failed to start Discord bot:', err);
    }
})();

// --- Web Server Startup ---
const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine and configure static/public folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'web', 'views'));
app.use(json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Use the main router for web endpoints
app.use('/', router);

app.listen(PORT, () => {
    console.log(`Web portal running at http://localhost:${PORT}`);
});