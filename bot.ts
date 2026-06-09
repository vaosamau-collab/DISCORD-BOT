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

// --- 1. تسجيل أوامر السلاش عند تشغيل البوت ---
client.once('ready', async () => {
    try {
        const commands = [
            new SlashCommandBuilder().setName('ping').setDescription('فحص سرعة استجابة النظام'),
            new SlashCommandBuilder().setName('clear').setDescription('تنظيف الشات من الرسائل').addIntegerOption(o => o.setName('amount').setDescription('عدد الرسائل (1-100)').setRequired(true)),
            new SlashCommandBuilder().setName('kick').setDescription('طرد عضو من السيرفر').addUserOption(o => o.setName('target').setDescription('العضو المراد طرده').setRequired(true)),
            new SlashCommandBuilder().setName('ban').setDescription('حظر عضو من السيرفر').addUserOption(o => o.setName('target').setDescription('العضو المراد حظره').setRequired(true))
        ].map(cmd => cmd.toJSON()); // الخدعة السحرية: تحويل الأوامر لمنع الكراش نهائياً!

        const rest = new REST({ version: '10' }).setToken(TOKEN);
        
        console.log('🔄 جاري تحديث وتسجيل أوامر السلاش في ديسكورد...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        
        console.log(`✅ تم تسجيل جميع الأوامر بنجاح وبدون كراش!`);
        client.user.setActivity('إدارة السيرفر بالسلاش / 🛡️');
    } catch (error) {
        console.error('❌ حدث خطأ أثناء التسجيل:', error);
    }
});

// --- 2. معالجة وتشغيل أوامر السلاش (/) ---
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;

    // أمر البينج
    if (i.commandName === 'ping') {
        await i.reply({ content: `🚀 الاستجابة الحالية: ${client.ws.ping}ms`, ephemeral: true });
    }

    // أمر مسح الشات
    if (i.commandName === 'clear') {
        const amount = i.options.getInteger('amount');
        if (amount > 100 || amount < 1) return i.reply({ content: '❌ يرجى اختيار رقم بين 1 و 100.', ephemeral: true });
        
        await i.channel.bulkDelete(amount, true).catch(() => {});
        await i.reply({ content: `🧹 تم تنظيف السيرفر وحذف ${amount} رسالة!`, ephemeral: true });
    }

    // أمر الطرد
    if (i.commandName === 'kick') {
        const member = i.options.getMember('target');
        if (!member) return i.reply({ content: '❌ لم أجد هذا العضو في السيرفر.', ephemeral: true });
        
        await member.kick()
            .then(() => i.reply({ content: `✅ تم طرد العضو **${member.user.tag}** بنجاح.`, ephemeral: true }))
            .catch(() => i.reply({ content: '❌ فشل الطرد! تأكد من أن رتبة البوت أعلى من رتبة الشخص.', ephemeral: true }));
    }

    // أمر الحظر
    if (i.commandName === 'ban') {
        const member = i.options.getMember('target');
        if (!member) return i.reply({ content: '❌ لم أجد هذا العضو في السيرفر.', ephemeral: true });
        
        await member.ban()
            .then(() => i.reply({ content: `🔨 تم حظر العضو **${member.user.tag}** نهائياً.`, ephemeral: true }))
            .catch(() => i.reply({ content: '❌ فشل الحظر! تأكد من صلاحيات رتبة البوت.', ephemeral: true }));
    }
});

// --- 3. نظام الفلتر التلقائي (يعمل في الشات مباشرة بدون أوامر) ---
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        
        const logChannel = m.guild.channels.cache.get("1508091945883275495");
        if (logChannel) {
            logChannel.send(`🚨 **مخالفة شات مرصودة**\nالمخالف: ${m.author.tag}\nالرسالة المحذوفة: ${m.content}`);
        }
    }
});

client.login(TOKEN);
