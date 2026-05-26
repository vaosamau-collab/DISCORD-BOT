// @ts-nocheck
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

client.once('ready', () => {
    console.log(`✅ البوت متصل الآن بنجاح: ${client.user.tag}`);
    client.user.setActivity('نظام أسامة | آمن ومستقر 🛡️');
});

// هذا هو "جدار الحماية" الأساسي
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    // أوامر نصية سريعة (لا تسبب كراش أبداً)
    if (m.content === '!ping') {
        m.reply('البوت يعمل بكامل طاقته! 🚀');
    }
});

client.login(process.env.DISCORD_TOKEN);
