// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

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

// --- 1. تسجيل أوامر السلاش (عربي + إنجليزي) ---
client.once('ready', async () => {
    try {
        const commands = [
            new SlashCommandBuilder().setName('ping').setDescription('فحص السرعة بالإنجليزية'),
            new SlashCommandBuilder().setName('فحص').setDescription('فحص سرعة استجابة البوت (Ping)'),
            new SlashCommandBuilder().setName('clear').setDescription('مسح الرسائل بالإنجليزية').addIntegerOption(o => o.setName('amount').setDescription('عدد الرسائل').setRequired(true)),
            new SlashCommandBuilder().setName('مسح').setDescription('تنظيف الشات من الرسائل').addIntegerOption(o => o.setName('العدد').setDescription('عدد الرسائل المراد مسحها').setRequired(true)),
            new SlashCommandBuilder().setName('طرد').setDescription('طرد عضو مخالف').addUserOption(o => o.setName('العضو').setDescription('اختر العضو المراد طرده').setRequired(true)),
            new SlashCommandBuilder().setName('حظر').setDescription('حظر عضو نهائياً').addUserOption(o => o.setName('العضو').setDescription('اختر العضو المراد حظره').setRequired(true))
        ].map(cmd => cmd.toJSON());

        const rest = new REST({ version: '10' }).setToken(TOKEN);
        console.log('🔄 جاري رفع وتحديث أوامر السلاش المزدوجة...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log(`✅ البوت مستقر تماماً في ريلواي وكل الأوامر نشطة!`);
    } catch (error) {
        console.log('⚠️ تم تجاوز خطأ التسجيل لتفادي الكراش.');
    }
    client.user.setActivity('🛡️ سيرفر أسامة');
});

// --- 2. تشغيل الأوامر ---
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;

    try {
        // أوامر الفحص (Ping)
        if (i.commandName === 'فحص' || i.commandName === 'ping') {
            await i.reply({ content: `🚀 سرعة الاستجابة الحالية: **${client.ws.ping}ms**`, ephemeral: true });
        }

        // أوامر مسح الشات (Clear)
        if (i.commandName === 'مسح' || i.commandName === 'clear') {
            const amount = i.options.getInteger('العدد') || i.options.getInteger('amount');
            if (amount > 100 || amount < 1) return i.reply({ content: '❌ اكتب رقم بين 1 و 100.', ephemeral: true });
            await i.channel.bulkDelete(amount, true);
            await i.reply({ content: `🧹 تم تنظيف الروم وحذف **${amount}** رسالة بنجاح!`, ephemeral: true });
        }

        // أمر الطرد
        if (i.commandName === 'طرد') {
            const member = i.options.getMember('العضو');
            await member.kick();
            await i.reply({ content: `✅ تم طرد **${member.user.tag}** بنجاح.`, ephemeral: true });
        }

        // أمر الحظر
        if (i.commandName === 'حظر') {
            const member = i.options.getMember('العضو');
            await member.ban();
            await i.reply({ content: `🔨 تم حظر **${member.user.tag}** نهائياً.`, ephemeral: true });
        }
    } catch (err) {
        await i.reply({ content: '❌ حدث خطأ، تأكد من صلاحيات رتبة البوت بالسيرفر!', ephemeral: true });
    }
});

// --- 3. نظام الفلتر وبحث تلقائي عن روم اللوق ---
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        
        // البحث عن روم اللوق المتواجد عندك بالسيرفر تلقائياً
        const logChannel = m.guild.channels.cache.find(ch => ch.name.includes('log'));
        if (logChannel) {
            logChannel.send(`🚨 **مخالفة شات**\nالمخالف: ${m.author.tag}\nالكلمة المحذوفة: ${m.content}`);
        }
    }
});

client.login(TOKEN);
