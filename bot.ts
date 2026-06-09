// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

// --- 1. تسجيل أوامر السلاش بالعربي لمنع خطأ الاستجابة ---
client.once('ready', async () => {
    try {
        const commands = [
            new SlashCommandBuilder().setName('فحص').setDescription('فحص سرعة استجابة البوت (Ping)'),
            new SlashCommandBuilder().setName('مسح').setDescription('تنظيف الشات من الرسائل').addIntegerOption(o => o.setName('العدد').setDescription('عدد الرسائل المراد مسحها (1-100)').setRequired(true)),
            new SlashCommandBuilder().setName('طرد').setDescription('طرد عضو مخالف من السيرفر').addUserOption(o => o.setName('العضو').setDescription('اختر العضو المراد طرده').setRequired(true)),
            new SlashCommandBuilder().setName('حظر').setDescription('حظر عضو نهائياً من السيرفر').addUserOption(o => o.setName('العضو').setDescription('اختر العضو المراد حظره').setRequired(true))
        ].map(cmd => cmd.toJSON());

        const rest = new REST({ version: '10' }).setToken(TOKEN);
        
        console.log('🔄 جاري رفع وتحديث أوامر السلاش باللغة العربية...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        
        console.log(`✅ البوت جاهز تماماً وكل الأوامر العربية نشطة!`);
        client.user.setActivity('إدارة السيرفر بالعربي / 🛡️');
    } catch (error) {
        console.error('❌ خطأ في التسجيل:', error);
    }
});

// --- 2. تشغيل الأوامر واستقبال الضغطات ---
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;

    // أمر الفحص (البينج)
    if (i.commandName === 'فحص') {
        await i.reply({ content: `🚀 سرعة الاستجابة الحالية: **${client.ws.ping}ms**`, ephemeral: true });
    }

    // أمر مسح الشات
    if (i.commandName === 'مسح') {
        const amount = i.options.getInteger('العدد');
        if (amount > 100 || amount < 1) return i.reply({ content: '❌ اكتب رقم بين 1 و 100 يا أسامة.', ephemeral: true });
        
        await i.channel.bulkDelete(amount, true).catch(() => {});
        await i.reply({ content: `🧹 تم تنظيف الروم وحذف **${amount}** رسالة بنجاح!`, ephemeral: true });
    }

    // أمر الطرد
    if (i.commandName === 'طرد') {
        const member = i.options.getMember('العضو');
        if (!member) return i.reply({ content: '❌ لم يتم العثور على العضو.', ephemeral: true });
        
        await member.kick()
            .then(() => i.reply({ content: `✅ تم طرد **${member.user.tag}** من السيرفر.`, ephemeral: true }))
            .catch(() => i.reply({ content: '❌ ما أقدر أطرده! تأكد أن رتبة البوت أعلى من رتبته.', ephemeral: true }));
    }

    // أمر الحظر
    if (i.commandName === 'حظر') {
        const member = i.options.getMember('العضو');
        if (!member) return i.reply({ content: '❌ لم يتم العثور على العضو.', ephemeral: true });
        
        await member.ban()
            .then(() => i.reply({ content: `🔨 تم حظر **${member.user.tag}** بنجاح.`, ephemeral: true }))
            .catch(() => i.reply({ content: '❌ فشل الحظر، تأكد من صلاحيات البوت ورتبته.', ephemeral: true }));
    }
});

// --- 3. نظام الفلتر الآلي (شغال تلقائي بالشات) ---
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        
        const logChannel = m.guild.channels.cache.get("1508091945883275495");
        if (logChannel) {
            logChannel.send(`🚨 **مخالفة شات**\nالمخالف: ${m.author.tag}\nالكلمة المحذوفة: ${m.content}`);
        }
    }
});

client.login(TOKEN);
