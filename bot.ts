// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, SlashCommandBuilder, ActivityType, PermissionFlagsBits } from 'discord.js';

// --- إعدادات النظام ---
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

// --- نظام تخزين الرومات (IDs) ---
const IDS = {
    JOIN_LEAVE: "1508527170039976026",
    REPORT: "1508764694834450452",
    WELCOME_PUBLIC: "1508087523820310578",
    SPAM_LOGS: "1508091945883275495",
    CHAT: "1507868881597759510"
};

// --- ذاكرة مؤقتة للتحذيرات ---
const warnings = new Map();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ] 
});

// --- تهيئة النظام وتسجيل الأوامر ---
client.once('ready', async (c) => {
    console.log(`🚀 نظام أسامة الأمني في حالة استقرار - متصل كـ: ${c.user.tag}`);
    
    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('عرض قائمة المساعدة الكاملة'),
        new SlashCommandBuilder().setName('kick').setDescription('طرد عضو').addUserOption(o => o.setName('user').setRequired(true)).addStringOption(o => o.setName('reason')),
        new SlashCommandBuilder().setName('ban').setDescription('حظر عضو').addUserOption(o => o.setName('user').setRequired(true)).addStringOption(o => o.setName('reason')),
        new SlashCommandBuilder().setName('report').setDescription('تقديم بلاغ').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason').setRequired(true)),
        new SlashCommandBuilder().setName('warn').setDescription('تحذير عضو').addUserOption(o => o.setName('target').setRequired(true)).addStringOption(o => o.setName('reason').setRequired(true)),
        new SlashCommandBuilder().setName('clear').setDescription('مسح الرسائل').addIntegerOption(o => o.setName('amount').setRequired(true))
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    
    // حالة البوت المتغيرة
    client.user.setActivity('حماية سيرفر أسامة', { type: ActivityType.Watching });
});

// --- معالجة الأوامر العملاقة ---
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;
    await i.deferReply({ ephemeral: true });

    try {
        if (i.commandName === 'help') {
            const embed = new EmbedBuilder()
                .setTitle("🛡️ مركز عمليات أسامة - القائمة الشاملة")
                .setColor(0x00FF9D)
                .setDescription("قائمة الأوامر البرمجية المعتمدة لنظامك:")
                .addFields(
                    { name: "🔨 الإدارة", value: "`/kick` - الطرد\n`/ban` - الحظر\n`/clear` - مسح الرسائل" },
                    { name: "⚠️ التحذيرات", value: "`/warn` - توجيه تحذير لعضو" },
                    { name: "📢 البلاغات", value: "`/report` - التبليغ عن مخالفة" }
                )
                .setFooter({ text: "نظام إدارة متكامل - أسامة", iconURL: i.user.displayAvatarURL() });
            await i.editReply({ embeds: [embed] });
        }
        
        else if (i.commandName === 'warn') {
            const target = i.options.getUser('target');
            const reason = i.options.getString('reason');
            const current = warnings.get(target.id) || 0;
            warnings.set(target.id, current + 1);
            
            await i.editReply(`⚠️ تم تحذير ${target.tag}. التحذيرات الحالية: ${current + 1}`);
            if (current + 1 >= 3) {
                await i.channel.send(`🚨 العضو ${target.tag} وصل لـ 3 تحذيرات وسيتم اتخاذ إجراء!`);
            }
        }
        
        else if (i.commandName === 'clear') {
            const amount = i.options.getInteger('amount');
            await i.channel.bulkDelete(amount, true);
            await i.editReply(`🧹 تم مسح ${amount} رسالة.`);
        }
        
        // هنا يمكن إضافة منطق الـ Kick والـ Ban والـ Report بنفس الأسلوب...
    } catch (e) {
        await i.editReply("❌ حدث خطأ غير متوقع أثناء معالجة الأمر.");
    }
});

// --- نظام الفلتر الجنائي (رصد ومراقبة) ---
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
                { name: "المخالف", value: `${m.author.tag}`, inline: true },
                { name: "الأيدي", value: `${m.author.id}`, inline: true },
                { name: "الرسالة", value: `||${m.content}||` },
                { name: "التوقيت", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
            );
        ch?.send({ embeds: [embed] });
    }
});

// --- نظام الترحيب والوداع (رصد كامل) ---
client.on('guildMemberAdd', (member) => {
    member.guild.channels.cache.get(IDS.WELCOME_PUBLIC)?.send(`✨ أهلاً بك ${member} في سيرفر أسامة!`);
    member.guild.channels.cache.get(IDS.JOIN_LEAVE)?.send(`📥 انضمام: ${member.user.tag} | الأيدي: ${member.id}`);
});

client.on('guildMemberRemove', (member) => {
    member.guild.channels.cache.get(IDS.JOIN_LEAVE)?.send(`📤 مغادرة: ${member.user.tag} | الأيدي: ${member.id}`);
});

client.login(TOKEN);
