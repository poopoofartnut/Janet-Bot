import express from 'express';
import { json } from 'body-parser';
import router from './routes/index';
import session from 'express-session';

const app = express();
const PORT = process.env.PORT || 3000;

// Add this before your routes:
app.use(session({
    secret: 'your-session-secret', // use a strong secret in production!
    resave: false,
    saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.use(json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/', router);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});