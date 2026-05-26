// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, SlashCommandBuilder, ActivityType, PermissionFlagsBits } from 'discord.js';

// --- [1] الإعدادات الأساسية ---
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

// --- [2] الرومات المعتمدة (ID Storage) ---
const IDS = {
    JOIN_LEAVE: "1508527170039976026",
    REPORT: "1508764694834450452",
    WELCOME_PUBLIC: "1508087523820310578",
    SPAM_LOGS: "1508091945883275495",
    CHAT: "1507868881597759510"
};

// --- [3] ذاكرة النظام ---
const warnings = new Map();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ] 
});

// --- [4] تسجيل الأوامر (قسم التعريفات) ---
client.once('ready', async (c) => {
    console.log(`✅ النظام الأمني في وضع التشغيل الكامل: ${c.user.tag}`);
    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('قائمة المساعدة الاحترافية'),
        new SlashCommandBuilder().setName('kick').setDescription('طرد عضو').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason')),
        new SlashCommandBuilder().setName('ban').setDescription('حظر عضو').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason')),
        new SlashCommandBuilder().setName('report').setDescription('بلاغ').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason').setRequired(true)),
        new SlashCommandBuilder().setName('warn').setDescription('إعطاء تحذير').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason')),
        new SlashCommandBuilder().setName('userinfo').setDescription('معلومات عضو').addUserOption(o => o.setName('target').setRequired(true)),
        new SlashCommandBuilder().setName('clear').setDescription('مسح الرسائل').addIntegerOption(o => o.setName('count').setRequired(true))
    ];
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    client.user.setActivity('نظام أسامة الأمني | 🛡️', { type: ActivityType.Watching });
});

// --- [5] تنفيذ الأوامر ---
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;
    await i.deferReply({ ephemeral: true });

    try {
        if (i.commandName === 'help') {
            const embed = new EmbedBuilder().setTitle("🛡️ مركز تحكم أسامة").setColor(0x00AAFF).addFields(
                { name: "🔨 الإدارة", value: "`/kick` - الطرد\n`/ban` - الحظر\n`/clear` - مسح الشات" },
                { name: "📢 البلاغات", value: "`/report` - تقديم بلاغ رسمي" },
                { name: "👤 العضو", value: "`/userinfo` - معلومات العضو\n`/warn` - تحذير" }
            );
            await i.editReply({ embeds: [embed] });
        }
        else if (i.commandName === 'userinfo') {
            const member = i.options.getMember('target');
            await i.editReply(`👤 ${member.user.tag}\n📅 تاريخ الانضمام: ${member.joinedAt.toDateString()}\n🆔 الأيدي: ${member.id}`);
        }
        else if (i.commandName === 'warn') {
            const target = i.options.getUser('target');
            const count = (warnings.get(target.id) || 0) + 1;
            warnings.set(target.id, count);
            await i.editReply(`⚠️ تم تحذير ${target.tag}. عدد التحذيرات: ${count}`);
        }
        else if (i.commandName === 'clear') {
            const count = i.options.getInteger('count');
            await i.channel.bulkDelete(count, true);
            await i.editReply(`🧹 تم تنظيف ${count} رسالة.`);
        }
    } catch (e) { await i.editReply("❌ حدث خطأ برمجي."); }
});

// --- [6] الفلتر الجنائي ---
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;
    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        const ch = m.guild.channels.cache.get(IDS.SPAM_LOGS);
        ch?.send({ embeds: [new EmbedBuilder().setTitle("🚨 رصد مخالفة").setColor(0xFF0000).addFields({name: "المخالف", value: m.author.tag}, {name: "الرسالة", value: m.content})] });
    }
});

// --- [7] ترحيب + خروج (نظام الرصد) ---
client.on('guildMemberAdd', (m) => {
    m.guild.channels.cache.get(IDS.WELCOME_PUBLIC)?.send(`✨ نورت سيرفرنا يا ${m}!`);
    m.guild.channels.cache.get(IDS.JOIN_LEAVE)?.send(`📥 انضم: ${m.user.tag}`);
});

client.on('guildMemberRemove', (m) => {
    m.guild.channels.cache.get(IDS.JOIN_LEAVE)?.send(`📤 خرج: ${m.user.tag}`);
});

client.login(TOKEN);
