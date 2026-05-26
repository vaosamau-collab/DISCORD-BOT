// @ts-nocheck
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

// هنا تضع ID الروم اللي تبي يرسل فيه تبليغ المخالفة
const LOG_CHANNEL_ID = "1508091945883275495"; 

client.once('ready', () => {
    console.log(`✅ البوت مستقر ويعمل: ${client.user.tag}`);
});

client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    // 1. نظام الفلتر
    const badWords = ["زق", "كلب", "خرا"]; // أضف أي كلمات تبيها هنا
    const content = m.content || "";

    if (badWords.some(w => content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        
        const logChannel = m.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) {
            const embed = new EmbedBuilder()
                .setTitle("🚨 رصد مخالفة")
                .setColor(0xFF0000)
                .setDescription(`تم حذف رسالة مخالفة من **${m.author.tag}**`)
                .addFields({ name: "الرسالة:", value: content });
            
            await logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    }

    // 2. أمر التجربة
    if (m.content === '!ping') {
        m.reply('البوت مستقر جداً! 🛡️');
    }
});

client.login(process.env.DISCORD_TOKEN);
