import express from 'express';
import { json } from 'body-parser';
import router from './routes/index';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/', router);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});