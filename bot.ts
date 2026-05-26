// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, SlashCommandBuilder, ActivityType } from 'discord.js';

// --- [ CONFIGURATION ] ---
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

const IDS = {
    JOIN_LEAVE: "1508527170039976026",
    REPORT: "1508764694834450452",
    WELCOME_PUBLIC: "1508087523820310578",
    SPAM_LOGS: "1508091945883275495",
    CHAT: "1507868881597759510"
};

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

// --- [ COMMAND REGISTRATION ENGINE ] ---
client.once('ready', async (c) => {
    console.log(`[SYSTEM] Initializing bot services...`);
    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('عرض المساعدة الشاملة'),
        new SlashCommandBuilder().setName('kick').setDescription('طرد عضو').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('سبب الطرد')),
        new SlashCommandBuilder().setName('ban').setDescription('حظر عضو').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('سبب الحظر')),
        new SlashCommandBuilder().setName('report').setDescription('تقديم بلاغ').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason').setRequired(true)),
        new SlashCommandBuilder().setName('userinfo').setDescription('معلومات عضو').addUserOption(o => o.setName('target').setRequired(true)),
        new SlashCommandBuilder().setName('serverinfo').setDescription('معلومات السيرفر'),
        new SlashCommandBuilder().setName('warn').setDescription('إضافة تحذير').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason')),
        new SlashCommandBuilder().setName('clear').setDescription('تنظيف الشات').addIntegerOption(o => o.setName('count').setRequired(true))
    ];
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    client.user.setActivity('نظام أسامة الأمني | 🛡️', { type: ActivityType.Watching });
    console.log(`[SYSTEM] All commands deployed successfully.`);
});

// --- [ INTERACTION HANDLER ] ---
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;
    await i.deferReply({ ephemeral: true }).catch(() => {});
    
    // Safety check for all inputs
    const target = i.options.getMember('target');
    const reason = i.options.getString('reason') || 'لا يوجد سبب';

    try {
        if (i.commandName === 'help') {
            const embed = new EmbedBuilder().setTitle("🛡️ مركز تحكم أسامة").setColor(0x00AAFF).addFields(
                { name: "🔨 إدارة", value: "/kick, /ban, /clear" },
                { name: "📢 بلاغات", value: "/report" },
                { name: "👤 معلومات", value: "/userinfo, /serverinfo" }
            );
            await i.editReply({ embeds: [embed] });
        }
        else if (i.commandName === 'kick' && target) {
            await target.kick(reason);
            await i.editReply(`✅ تم طرد ${target.user.tag}. السبب: ${reason}`);
        }
        else if (i.commandName === 'ban' && target) {
            await target.ban({ reason });
            await i.editReply(`✅ تم حظر ${target.user.tag}. السبب: ${reason}`);
        }
        else if (i.commandName === 'report' && target) {
            const ch = i.guild.channels.cache.get(IDS.REPORT);
            ch?.send(`📢 بلاغ ضد ${target.user.tag} من ${i.user.tag}\nالسبب: ${reason}`);
            await i.editReply("✅ تم توثيق بلاغك.");
        }
        else if (i.commandName === 'clear') {
            const count = i.options.getInteger('count');
            await i.channel.bulkDelete(count, true);
            await i.editReply(`🧹 تم مسح ${count} رسالة.`);
        }
    } catch (e) {
        await i.editReply("❌ حدث خطأ في تنفيذ الأمر (تأكد من صلاحيات البوت).");
    }
});

// --- [ SECURITY FILTER ENGINE ] ---
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;
    const badWords = ["زق", "كلب", "خرا"];
    const text = m.content;
    
    if (badWords.some(w => text.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        const ch = m.guild.channels.cache.get(IDS.SPAM_LOGS);
        const embed = new EmbedBuilder()
            .setTitle("🚨 رصد مخالفة أمنية")
            .setColor(0xFF0000)
            .addFields(
                { name: "المخالف", value: m.author.tag },
                { name: "الرسالة", value: text || "نص مخفي" }
            );
        ch?.send({ embeds: [embed] });
    }
});

// --- [ MEMBER TRACKING ENGINE ] ---
client.on('guildMemberAdd', (m) => {
    m.guild.channels.cache.get(IDS.JOIN_LEAVE)?.send(`📥 دخول: ${m.user.tag}`);
    m.guild.channels.cache.get(IDS.WELCOME_PUBLIC)?.send(`✨ أهلاً بك يا ${m} في سيرفر أسامة!`);
});

client.on('guildMemberRemove', (m) => {
    m.guild.channels.cache.get(IDS.JOIN_LEAVE)?.send(`📤 خروج: ${m.user.tag}`);
});

client.login(TOKEN);
