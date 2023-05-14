import axios from "axios";
import {config} from 'dotenv';
import express from "express";

config();
const app = express();

app.use(express.json())
app.use(
    express.urlencoded({
        extended: true
    })
)

const TELEGRAM_URI = `https://api.telegram.org/bot${process.env.API_TOKEN}`

app.post("/new", async (req, res) => {
    const {message} = req.body;

    const text = message?.text?.toLowerCase().trim();
    const chatId = message?.chat?.id;

    console.log(message, text, chatId);

    if (!text || !chatId) {
        return res.sendStatus(400)
    }

    try {
        await axios.post(`${TELEGRAM_URI}/sendMessage`, {
            chat_id: chatId,
            text: `mhem ${text}`
        });
        res.send('Done');
    } catch (e) {
        console.log(e);
        res.send(e);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})