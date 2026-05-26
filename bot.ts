// @ts-nocheck
const { 
    Client, GatewayIntentBits, Events, REST, Routes, 
    PermissionsBitField, EmbedBuilder, ActivityType 
} = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ] 
});

// --- قاعدة بيانات الكلمات ---
let bannedWords = ["زق", "كلب", "لعنة", "لعنه", "خنزير", "حمار", "حقير", "سافل", "خرا"];

// --- الإعدادات الثابتة ---
const LOGS_ID = "1508091945883275495";
const MY_ID = "1157314208988405760";

// --- دالة إرسال سجلات المخالفات ---
async function sendViolationLog(guild, member, foundWord) {
    const logs = guild.channels.cache.get(LOGS_ID);
    if (!logs) return;

    const embed = new EmbedBuilder()
        .setTitle("🚨 رصد مخالفة - نظام أسامة")
        .setColor(0xFF0000)
        .addFields(
            { name: "👤 العضو:", value: member.tag || "غير معروف" },
            { name: "🚫 الكلمة:", value: `||${foundWord}||` },
            { name: "🕒 الوقت:", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
        )
        .setFooter({ text: "نظام أسامة المطور" });
    
    await logs.send({ embeds: [embed] });
}

// --- دالة مراسلة العضو في الخاص ---
async function sendDM(member, message) {
    try {
        await member.send(message);
    } catch (e) {
        console.log("تعذر إرسال الخاص: العضو أغلق الرسائل أو حظر البوت.");
    }
}

// --- الأوامر المتقدمة (Slash) ---
const commands = [
    { name: 'ping', description: 'اختبار سرعة البوت' },
    { name: 'say', description: 'كتابة رسالة عبر البوت', options: [{ name: 'نص', type: 3, description: 'النص المطلوب', required: true }] },
    { name: 'kick', description: 'طرد عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'السبب', type: 3, required: true }] },
    { name: 'ban', description: 'حظر عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'السبب', type: 3, required: true }] },
    { name: 'إضافة_كلمة', description: 'إضافة كلمة للمحظورات', options: [{ name: 'كلمة', type: 3, required: true }] },
    { name: 'حذف_كلمة', description: 'حذف كلمة من المحظورات', options: [{ name: 'كلمة', type: 3, required: true }] }
];

client.once(Events.ClientReady, async (c) => {
    console.log(`✅ النظام يعمل بكفاءة: ${c.user.tag}`);
    c.user.setActivity('سيرفر أسامة', { type: ActivityType.Watching });
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
});

// --- إدارة الأوامر ---
client.on(Events.InteractionCreate, async (i) => {
    if (!i.isChatInputCommand()) return;
    if (i.user.id !== MY_ID) return i.reply({ content: "🚫 أنت لست المطور (أسامة).", ephemeral: true });

    const member = i.options.getMember('عضو');
    const reason = i.options.getString('السبب');

    switch(i.commandName) {
        case 'ping': await i.reply(`🏓 Pong! (${client.ws.ping}ms)`); break;
        case 'say': await i.channel.send(i.options.getString('نص')); await i.reply({ content: "✅ تم.", ephemeral: true }); break;
        case 'kick':
            await member.kick(reason);
            await i.reply(`🔨 تم طرد ${member.user.tag} | السبب: ${reason}`);
            break;
        case 'ban':
            await member.ban({ reason: reason });
            await i.reply(`🚫 تم حظر ${member.user.tag} | السبب: ${reason}`);
            break;
        case 'إضافة_كلمة':
            bannedWords.push(i.options.getString('كلمة'));
            await i.reply(`✅ تم إضافة الكلمة للقائمة.`);
            break;
        case 'حذف_كلمة':
            bannedWords = bannedWords.filter(w => w !== i.options.getString('كلمة'));
            await i.reply(`🗑️ تم حذف الكلمة.`);
            break;
    }
});

// --- الفلتر الذكي (التدقيق) ---
client.on(Events.MessageCreate, async (m) => {
    if (m.author.bot || !m.member || m.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    
    const content = m.content.toLowerCase();
    const found = bannedWords.find(word => content.includes(word.toLowerCase()));

    if (found) {
        await m.delete().catch(() => {});
        await sendDM(m.author, `⚠️ تنبيه: تم حذف رسالتك لوجود كلمة ممنوعة: "${found}"`);
        await sendViolationLog(m.guild, m.author, found);
    }
});

client.login(process.env.DISCORD_TOKEN);
