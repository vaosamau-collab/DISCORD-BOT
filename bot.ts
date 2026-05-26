// @ts-nocheck
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

client.once('ready', () => {
    console.log("✅ البوت اشتغل بدون تسجيل أوامر (للتجربة فقط)");
});

client.on('messageCreate', (m) => {
    if (m.content === '!ping') {
        m.reply('البوت شغال زي اللوز!');
    }
});

client.login(process.env.DISCORD_TOKEN);
