import axios from "axios";
import { log } from "console";
import {config} from 'dotenv';
import express from "express";

config();
const TELEGRAM_URI = `https://api.telegram.org/bot${process.env.API_TOKEN}`;

//Check webhook status before deploy
const status = await axios.get(`${TELEGRAM_URI}/getWebhookInfo`);
if(!status?.data || !status?.data.result.url) {
    log(`Setting webhook on url:${HOST_URL}`);
    const res = await axios.post(`${TELEGRAM_URI}/setWebhook`, `url=${HOST_URL}/message`)
    log(res.data);
}

const app = express();
app.use(express.json())
app.use(
    express.urlencoded({
        extended: true
    })
)

app.post("/message", async (req, res) => {
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