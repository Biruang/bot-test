import axios from "axios";
import { log } from "console";
import {config} from 'dotenv';
import express from "express";
import cron from 'node-cron';

config();
const TELEGRAM_URI = `https://api.telegram.org/bot${process.env.API_TOKEN}`;

// const res = await axios.get(`${TELEGRAM_URI}/deleteWebhook`)
// log(res.data);

// Check webhook status before deploy
const status = await axios.get(`${TELEGRAM_URI}/getWebhookInfo`);
if(!status?.data || !status?.data.result.url) {
    log(`Setting webhook on url:${process.env.HOST_URL}`);
    const res = await axios.post(`${TELEGRAM_URI}/setWebhook`, `url=${process.env.HOST_URL}/message`)
    log(res.data);
}

const app = express();
app.use(express.json())
app.use(
    express.urlencoded({
        extended: true
    })
)

let tasks = {}

const sendPing = async (id) => {
    try {
        await axios.post(`${TELEGRAM_URI}/sendMessage`, {
            chat_id: id,
            text: 'ping'
        });
        res.send('Done');
    } catch (e) {
        console.log(e);
        res.send(e);
    }
}

app.post("/message", async (req, res) => {
    const {message} = req.body;

    const text = message?.text?.toLowerCase().trim();
    const chatId = message?.chat?.id;
    log('receve', text, chatId);
    if (!text || !chatId) {
        return res.sendStatus(400)
    }

    let responce = 'Please use correct comand';
    switch(text) {
        case '/start': {
            if(Boolean(tasks[chatId])) {
                responce = 'Already tracking';
                break;
            }
            responce = 'Start tracking';
            const task = cron.schedule('* * * * *', () => {
                sendPing(chatId)
            }, {
                scheduled: true,
                timezone: "Europe/Moscow"
            });
            tasks[chatId] = task;
            task.start();
            break;
        }
        case '/stop': {
            if(!tasks[chatId]){
                responce = 'Already not tracking';
                break;
            }
            responce = 'End tracking';
            tasks[chatId].stop();
            delete tasks[chatId];
            break;
        }
    }

    try {
        await axios.post(`${TELEGRAM_URI}/sendMessage`, {
            chat_id: chatId,
            text: responce
        });
        res.send('Done');
    } catch (e) {
        console.log(e);
        res.send(e);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    log(`Server running on port ${PORT}`)
})