// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const LOGS_CHANNEL_ID = "1508091945883275495"; 
let bannedWords = ["سب", "شتم", "ممنوع", "زق"]; // يمكنك إضافة كلمات هنا
const warnings = new Map(); 

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.member) return;

    let isBad = false;
    let reason = "";

    // 1. الفحص السريع (الكلمات المحظورة)
    const msgContent = message.content.toLowerCase();
    const foundWord = bannedWords.find(word => msgContent.includes(word.toLowerCase()));
    
    if (foundWord) {
        isBad = true;
        reason = `كلمة محظورة: ${foundWord}`;
    } else {
        // 2. الفحص الذكي (إذا لم يجد كلمة في القائمة، يسأل الذكاء الاصطناعي)
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "حلل الرسالة، هل تحتوي على سب أو إهانة؟ أجب بـ YES فقط إذا كانت مسيئة، و NO إذا كانت طبيعية." },
                    { role: "user", content: message.content }
                ],
            });
            if (completion.choices[0].message.content.trim() === "YES") {
                isBad = true;
                reason = "تحليل الذكاء الاصطناعي (سب/إهانة)";
            }
        } catch (e) { console.error("خطأ AI:", e); }
    }

    // تنفيذ العقوبة
    if (isBad) {
        await message.delete().catch(() => {});
        const userId = message.author.id;
        const count = (warnings.get(userId) || 0) + 1;
        warnings.set(userId, count);

        let duration = 0; let actionName = "";
        if (count === 1) { duration = 5 * 60 * 1000; actionName = "كتم 5 دقائق"; }
        else if (count === 2) { duration = 60 * 60 * 1000; actionName = "كتم 1 ساعة"; }
        else if (count === 3) { duration = 5 * 60 * 60 * 1000; actionName = "كتم 5 ساعات"; }
        else if (count === 4) { duration = 7 * 60 * 60 * 1000; actionName = "كتم 7 ساعات"; }
        else { duration = 48 * 60 * 60 * 1000; actionName = "باند (كتم) 48 ساعة"; warnings.set(userId, 0); }

        await message.member.timeout(duration, reason).catch(() => {});
        message.channel.send(`${message.author}، **مخالفة ${count}**: ${actionName}. السبب: ${reason}`);

        const logsChannel = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (logsChannel) logsChannel.send(`⚠️ مخالفة: ${message.author.tag}\nالسبب: ${reason}\nالعقوبة: ${actionName}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
