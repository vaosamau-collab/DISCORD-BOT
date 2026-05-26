// @ts-nocheck
import { EmbedBuilder } from 'discord.js';

export const handleEvents = async (client) => {
    // --- حدث مراقبة الرسائل (الفلتر) ---
    client.on('messageCreate', async (m) => {
        if (m.author.bot) return;

        const bannedWords = ["زق", "كلب", "خرا"];
        const messageContent = m.content.toLowerCase();

        if (bannedWords.some(word => messageContent.includes(word))) {
            await m.delete().catch(() => {});
            
            const logsChannel = client.channels.cache.get(client.config.logsChannel);
            const embed = new EmbedBuilder()
                .setTitle("🚨 رصد مخالفة أمنية")
                .setDescription(`تم حذف رسالة مخالفة للعضو: ${m.author.tag}`)
                .setColor(0xFF0000)
                .setTimestamp();
            
            logsChannel?.send({ embeds: [embed] }).catch(() => {});
            m.channel.send(`⚠️ تنبيه: يا ${m.author}، ممنوع استخدام كلمات غير لائقة.`).then(msg => setTimeout(() => msg.delete(), 5000));
        }
    });

    client.on('ready', () => {
        console.log(`✅ النظام مفعل بنجاح على سيرفرات ديسكورد.`);
    });
};
