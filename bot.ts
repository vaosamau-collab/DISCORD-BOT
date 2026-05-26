// @ts-nocheck
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import * as fs from 'fs';
import { handleCommands } from './handlers/commands';
import { handleEvents } from './handlers/events';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ] 
});

client.commands = new Collection();
client.config = {
    logsChannel: "1508527170039976026",
    reportChannel: "1508764694834450452",
    dbPath: './database.json'
};

// إنشاء قاعدة بيانات إذا لم تكن موجودة
if (!fs.existsSync(client.config.dbPath)) {
    fs.writeFileSync(client.config.dbPath, JSON.stringify({ history: [], warns: {} }, null, 2));
}

(async () => {
    console.log("🚀 جاري تهيئة نظام أسامة الإداري...");
    await handleCommands(client);
    await handleEvents(client);
    await client.login(process.env.DISCORD_TOKEN);
})();

process.on('unhandledRejection', (err) => console.error('❌ CRITICAL ERROR:', err));
