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

const sendPing = async (id, first_name) => {
    try {
        await axios.post(`${TELEGRAM_URI}/sendMessage`, {
            chat_id: id,
            text: `${first_name}, твой смартфон набрал достаточное количество бактерий, позаботься о его чистоте и своем здоровье🤍`
        });
        res.send('Done');
    } catch (e) {
        console.log(e);
        res.send(e);
    }
}

app.post("/message", async (req, res) => {
    log('dddd', req)
    const message = req.body?.edited_message || req.body?.message

    const text = message?.text?.toLowerCase().trim();
    const chatId = message?.chat?.id;
    log('receve', text, message?.chat);
    if (!text || !chatId) {
        return res.sendStatus(400)
    }

    let responce = 'Не понимаю команду';
    switch(text) {
        case '/start': {
            if(Boolean(tasks[chatId])) {
                responce = "Напоминания уже включены";
                break;
            }
            responce = `"Привет, ${message.chat.first_name}!
                Рад, что ты теперь со мной, готов изменить свою жизнь и начать регулярно заботиться о гигиене своего мобильного устройства.
                Я буду присылать тебе напоминание о том, что пора протереть мобильный телефон❤️"`;

            const task = cron.schedule('* * * * *', () => {
                sendPing(chatId, message.chat.first_name)
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
                responce = "Сейчас нет активных напоминаний";
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