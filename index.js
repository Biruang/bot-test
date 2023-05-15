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

let tasks = [];

const sendPing = async (id, name) => {
    try {
        await axios.post(`${TELEGRAM_URI}/sendMessage`, {
            chat_id: id,
            text: `${name}, твой смартфон набрал достаточное количество бактерий, позаботься о его чистоте и своем здоровье🤍`
        });
    } catch (e) {
        console.log(e);
    }
}

// cron.schedule(
//     '* * * * *', 
//     () => {
//         log('tasks', tasks);
//         tasks.forEach((item) => sendPing(item.id, item.name)) 
//     }, {
//         scheduled: true,
//         timezone: "Europe/Moscow"
//     }
// )

cron.schedule(
    '0 8 * * *', 
    () => {
        log('tasks', tasks);
        tasks.forEach((item) => sendPing(item.id, item.name)) 
    }, {
        scheduled: true,
        timezone: "Europe/Moscow"
    }
)


cron.schedule(
    '0 6 * * *', 
    () => {
        log('tasks', tasks);
        tasks.forEach((item) => sendPing(item.id, item.name)) 
    }, {
        scheduled: true,
        timezone: "Europe/Moscow"
    }
)

cron.schedule(
    '0 11 * * *', 
    () => {
        log('tasks', tasks);
        tasks.forEach((item) => sendPing(item.id, item.name)) 
    }, {
        scheduled: true,
        timezone: "Europe/Moscow"
    }
)

cron.schedule(
    '0 16 * * *', 
    () => {
        log('tasks', tasks);
        tasks.forEach((item) => sendPing(item.id, item.name)) 
    }, {
        scheduled: true,
        timezone: "Europe/Moscow"
    }
)

app.post("/message", async (req, res) => {
    const message = req.body?.edited_message || req.body?.message
    const text = message?.text?.toLowerCase().trim();
    const chatId = message?.chat?.id;

    if (!text || !chatId) {
        return res.sendStatus(400)
    }

    let responce = 'Не понимаю команду';
    switch(text) {
        case '/start': {
            if(Boolean(tasks.find(el => el.id === chatId))) {
                responce = "Напоминания уже включены";
                break;
            }
            responce = `Привет, ${message.chat.first_name}!
            Рад, что ты теперь со мной, готов изменить свою жизнь и начать регулярно заботиться о гигиене своего мобильного устройства.
            Я буду присылать тебе напоминание о том, что пора протереть мобильный телефон❤️`;

            tasks.push({
                id: chatId,
                name: message.chat.first_name
            });
            break;
        }
        case '/stop': {
            if(!tasks.find(el => el.id === chatId)){
                responce = "Сейчас нет активных напоминаний";
                break;
            }
            responce = 'Напоминания больше приходить не будут';
            tasks = tasks.filter(el => el.id !== chatId);
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