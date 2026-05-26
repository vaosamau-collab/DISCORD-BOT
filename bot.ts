// @ts-nocheck
const { 
    Client, GatewayIntentBits, Events, REST, Routes, 
    PermissionsBitField, EmbedBuilder, ActivityType, AuditLogEvent 
} = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ] 
});

// --- إعدادات النظام ---
let bannedWords = ["زق", "كلب", "لعنة", "لعنه", "خنزير", "حمار", "حقير", "سافل", "خرا"];
const LOGS_ID = "1508527170039976026";
const OWNER_ID = "1157314208988405760";

// --- أوامر Slash المحترفة ---
const commands = [
    { name: 'ping', description: 'اختبار سرعة استجابة النظام' },
    { name: 'say', description: 'إرسال رسالة رسمية عبر البوت', options: [{ name: 'نص', type: 3, description: 'المحتوى', required: true }] },
    { name: 'kick', description: 'طرد عضو من السيرفر', options: [{ name: 'عضو', type: 6, required: true }, { name: 'السبب', type: 3, required: true }] },
    { name: 'ban', description: 'حظر عضو نهائياً', options: [{ name: 'عضو', type: 6, required: true }, { name: 'السبب', type: 3, required: true }] },
    { name: 'إضافة_كلمة', description: 'إضافة كلمة للفلتر', options: [{ name: 'كلمة', type: 3, required: true }] },
    { name: 'عرض_الكلمات', description: 'عرض جميع المحظورات' }
];

client.once(Events.ClientReady, async (c) => {
    console.log(`🚀 النظام الأمني مفعل بالكامل تحت إشراف: ${c.user.tag}`);
    c.user.setActivity('حماية سيرفر أسامة', { type: ActivityType.Watching });
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
});

// --- 1. نظام الفلترة (التحقق الدقيق) ---
client.on(Events.MessageCreate, async (m) => {
    if (m.author.bot || !m.member || m.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    
    const content = m.content.toLowerCase();
    const found = bannedWords.find(word => content.includes(word.toLowerCase()));

    if (found) {
        await m.delete().catch(() => {});
        
        const logs = m.guild.channels.cache.get(LOGS_ID);
        if (logs) {
            const embed = new EmbedBuilder()
                .setTitle("🚨 رصد مخالفة نصية")
                .setColor(0xFF0000)
                .addFields(
                    { name: "👤 العضو:", value: `${m.author.tag} (ID: ${m.author.id})` },
                    { name: "🚫 الكلمة المحظورة:", value: `||${found}||` },
                    { name: "🕒 التوقيت:", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
                );
            logs.send({ embeds: [embed] });
        }
    }
});

// --- 2. نظام رصد الخروج (احترافي) ---
client.on(Events.GuildMemberRemove, async (member) => {
    const logs = member.guild.channels.cache.get(LOGS_ID);
    if (!logs) return;

    const embed = new EmbedBuilder()
        .setTitle("📤 مغادرة عضو")
        .setColor(0xFFFF00)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
            { name: "👤 العضو:", value: `${member.user.tag}` },
            { name: "🆔 الآيدي:", value: `${member.id}` },
            { name: "🕒 توقيت المغادرة:", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
        )
        .setFooter({ text: "نظام أسامة - سجل خروج" });

    logs.send({ embeds: [embed] });
});

// --- 3. نظام الأوامر الإدارية ---
client.on(Events.InteractionCreate, async (i) => {
    if (!i.isChatInputCommand()) return;
    if (i.user.id !== OWNER_ID) return i.reply({ content: "🚫 غير مصرح لك.", ephemeral: true });

    await i.deferReply({ ephemeral: true });

    try {
        const cmd = i.commandName;
        if (cmd === 'ping') await i.editReply(`🏓 سرعة الاتصال: ${client.ws.ping}ms`);
        else if (cmd === 'say') { await i.channel.send(i.options.getString('نص')); await i.editReply("✅ تم الإرسال."); }
        else if (cmd === 'kick') {
            const member = i.options.getMember('عضو');
            await member.kick(i.options.getString('السبب'));
            await i.editReply(`🔨 تم طرد ${member.user.tag}.`);
        }
        else if (cmd === 'ban') {
            const member = i.options.getMember('عضو');
            await member.ban({ reason: i.options.getString('السبب') });
            await i.editReply(`🚫 تم حظر ${member.user.tag}.`);
        }
        else if (cmd === 'إضافة_كلمة') {
            bannedWords.push(i.options.getString('كلمة'));
            await i.editReply("✅ تمت إضافة الكلمة.");
        }
        else if (cmd === 'عرض_الكلمات') {
            await i.editReply(`🚫 القائمة الحالية: \`${bannedWords.join(', ')}\``);
        }
    } catch (e) {
        console.error(e);
        await i.editReply("⚠️ حدث خطأ أثناء تنفيذ الأمر.");
    }
});

client.login(process.env.DISCORD_TOKEN);
