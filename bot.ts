// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

client.once('ready', async (c) => {
    console.log("🧹 جاري تنظيف الأوامر القديمة...");
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    
    // المكنسة: إرسال قائمة فارغة [] يمسح كل شيء من ديسكورد
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
    
    console.log("✅ تم تنظيف كل شيء! البوت الآن نظيف تماماً.");
});

// أمر بديل بسيط جداً عشان تتاكد أنه شغال
client.on('messageCreate', (m) => {
    if (m.content === '!help') {
        m.reply("نظام أسامة الآن نظيف ويعمل بنجاح!");
    }
});

client.login(TOKEN);
