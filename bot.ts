// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

// الرومات
const IDS = {
    JOIN_LEAVE: "1508527170039976026",
    REPORT: "1508764694834450452",
    WELCOME_PUBLIC: "1508087523820310578",
    SPAM_LOGS: "1508091945883275495"
};

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

client.once('ready', async (c) => {
    // تعريف الأوامر بطريقة تضمن عدم حدوث خطأ الـ undefined
    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('عرض المساعدة'),
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('طرد عضو')
            .addUserOption(o => o.setName('target').setDescription('العضو المطلوب طرده').setRequired(true))
            .addStringOption(o => o.setName('reason').setDescription('سبب الطرد').setRequired(false)),
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('حظر عضو')
            .addUserOption(o => o.setName('target').setDescription('العضو المطلوب حظره').setRequired(true))
            .addStringOption(o => o.setName('reason').setDescription('سبب الحظر').setRequired(false))
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ البوت جاهز تماماً!");
});

// الفلتر الجنائي (تعديل جذري لمنع الكراش)
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;
    const badWords = ["زق", "كلب", "خرا"];
    
    // استخدام || "" للتأكد من أننا لا نرسل undefined أبداً
    const content = m.content || ""; 

    if (badWords.some(w => content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        const ch = m.guild.channels.cache.get(IDS.SPAM_LOGS);
        if (ch) {
            const embed = new EmbedBuilder()
                .setTitle("🚨 رصد مخالفة")
                .setColor(0xFF0000)
                .addFields(
                    { name: "المخالف", value: m.author.tag || "غير معروف" },
                    { name: "الرسالة", value: content.length > 0 ? content : "لا يوجد نص" }
                );
            await ch.send({ embeds: [embed] }).catch(() => {});
        }
    }
});

client.login(TOKEN);
