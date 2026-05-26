// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, SlashCommandBuilder, ActivityType, AuditLogEvent } from 'discord.js';

// --- 1. الإعدادات ---
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

// --- 2. تعريف الرومات ---
const IDS = {
    JOIN_LEAVE: "1508527170039976026",
    REPORT: "1508764694834450452",
    WELCOME_PUBLIC: "1508087523820310578",
    SPAM_LOGS: "1508091945883275495",
    CHAT: "1507868881597759510"
};

// --- 3. تهيئة العميل ---
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ] 
});

// --- 4. تسجيل الأوامر (قسم طويل) ---
client.once('ready', async (c) => {
    console.log(`[SYSTEM] البوت الآن متصل باسم: ${c.user.tag}`);
    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('عرض المساعدة'),
        new SlashCommandBuilder().setName('kick').setDescription('طرد').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason')),
        new SlashCommandBuilder().setName('ban').setDescription('حظر').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason')),
        new SlashCommandBuilder().setName('report').setDescription('بلاغ').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason').setRequired(true)),
        new SlashCommandBuilder().setName('warn').setDescription('تحذير').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason')),
        new SlashCommandBuilder().setName('userinfo').setDescription('معلومات').addUserOption(o => o.setName('target').setRequired(true)),
        new SlashCommandBuilder().setName('serverinfo').setDescription('معلومات السيرفر'),
        new SlashCommandBuilder().setName('clear').setDescription('مسح').addIntegerOption(o => o.setName('count').setRequired(true))
    ];
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    client.user.setActivity('حماية سيرفر أسامة', { type: ActivityType.Watching });
    console.log(`[SYSTEM] تم تسجيل ${commands.length} أمر بنجاح.`);
});

// --- 5. منطق الأوامر (موسع ومفصل) ---
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;
    await i.deferReply({ ephemeral: true });

    const target = i.options.getUser('target') || {};
    const reason = i.options.getString('reason') || 'لا يوجد سبب محدد';

    try {
        if (i.commandName === 'help') {
            await i.editReply({ embeds: [new EmbedBuilder().setTitle("🛡️ مركز تحكم أسامة").setColor(0x00AAFF).setDescription("كل الأوامر متاحة الآن.")] });
        }
        else if (i.commandName === 'kick') {
            await i.guild.members.kick(target.id, reason);
            await i.editReply(`🔨 تم طرد ${target.tag}`);
        }
        else if (i.commandName === 'report') {
            const ch = i.guild.channels.cache.get(IDS.REPORT);
            ch?.send(`📢 بلاغ: ${target.tag}\nالسبب: ${reason}`);
            await i.editReply("✅ تم الإبلاغ.");
        }
        else if (i.commandName === 'serverinfo') {
            await i.editReply(`اسم السيرفر: ${i.guild.name}\nعدد الأعضاء: ${i.guild.memberCount}`);
        }
    } catch (e) { await i.editReply("❌ خطأ."); }
});

// --- 6. نظام الرصد الأمني (الفلتر الجنائي) ---
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;
    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        const ch = m.guild.channels.cache.get(IDS.SPAM_LOGS);
        const embed = new EmbedBuilder()
            .setTitle("🚨 رصد مخالفة أمنية")
            .setColor(0xFF0000)
            .addFields(
                { name: "المخالف", value: m.author.tag, inline: true },
                { name: "الرسالة", value: m.content || "مخفية" },
                { name: "الوقت", value: new Date().toLocaleString() }
            );
        ch?.send({ embeds: [embed] });
    }
});

// --- 7. نظام الدخول والخروج المفصل ---
client.on('guildMemberAdd', (m) => {
    m.guild.channels.cache.get(IDS.JOIN_LEAVE)?.send(`📥 انضمام: ${m.user.tag} (ID: ${m.id})`);
    m.guild.channels.cache.get(IDS.WELCOME_PUBLIC)?.send(`👋 نورت السيرفر يا ${m}!`);
});

client.on('guildMemberRemove', (m) => {
    m.guild.channels.cache.get(IDS.JOIN_LEAVE)?.send(`📤 خروج: ${m.user.tag} (ID: ${m.id})`);
});

client.login(TOKEN);
