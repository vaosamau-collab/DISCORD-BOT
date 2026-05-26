// @ts-nocheck
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import * as fs from 'fs';
import { handleCommands } from './commands';
import { handleEvents } from './events';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ] 
});

// --- إعدادات النظام ---
client.commands = new Collection();
client.config = {
    logsChannel: "1508527170039976026",
    reportChannel: "1508764694834450452",
    dbPath: './database.json'
};

// --- تهيئة قاعدة البيانات ---
if (!fs.existsSync(client.config.dbPath)) {
    fs.writeFileSync(client.config.dbPath, JSON.stringify({ history: [], warns: {} }, null, 2));
}

// --- التشغيل الآمن ---
(async () => {
    console.log("========================================");
    console.log("🚀 جاري تحميل نظام أسامة الإداري...");
    await handleCommands(client);
    await handleEvents(client);
    await client.login(process.env.DISCORD_TOKEN);
    console.log("✅ البوت يعمل الآن بكامل طاقته!");
    console.log("========================================");
})();

// --- حماية من انهيار البرنامج ---
process.on('unhandledRejection', (err) => {
    console.error('❌ خطأ غير متوقع في النظام:', err);
});
