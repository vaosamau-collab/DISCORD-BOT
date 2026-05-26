// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ActivityType } from 'discord.js';

// --- إعدادات النظام ---
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";
const REPORT_CHANNEL = "1508764694834450452";
const LOGS_CHANNEL = "1508527170039976026";

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

// --- تشغيل النظام وتسجيل الأوامر ---
client.once('ready', async (c) => {
    console.log(`✅ النظام متصل كـ: ${c.user.tag}`);
    
    const commands = [
        { name: 'help', description: 'عرض قائمة الأوامر الإدارية' },
        { name: 'kick', description: 'طرد عضو مخالف', options: [{ name: 'عضو', type: 6, required: true }, { name: 'سبب', type: 3, required: true }] },
        { name: 'ban', description: 'حظر عضو نهائياً', options: [{ name: 'عضو', type: 6, required: true }, { name: 'سبب', type: 3, required: true }] },
        { name: 'report', description: 'إبلاغ عن عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'السبب', type: 3, required: true }] }
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ تم تحديث أوامر السلاش بنجاح.');
    } catch (e) {
        console.error('❌ خطأ في تسجيل الأوامر:', e);
    }
});

// --- معالجة الأوامر ---
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;
    await i.deferReply({ ephemeral: true }).catch(() => {});

    try {
        // [1] أمر الهيلب
        if (i.commandName === 'help') {
            const embed = new EmbedBuilder()
                .setTitle("🛡️ مركز تحكم أسامة - الإدارة")
                .setDescription("قائمة الأوامر المتاحة:")
                .setColor(0x00AAFF)
                .addFields(
                    { name: "🔨 الإدارة", value: "`/kick` - لطرد عضو\n`/ban` - لحظر عضو" },
                    { name: "📢 البلاغات", value: "`/report` - للتبليغ عن مخالفة" }
                )
                .setFooter({ text: "نظام إدارة آمن ومستقر" });
            await i.editReply({ embeds: [embed] });
        }

        // [2] أمر الكيك
        else if (i.commandName === 'kick') {
            const member = i.options.getMember('عضو');
            const reason = i.options.getString('سبب');
            if (!member.kickable) return i.editReply("❌ لا يمكنني طرد هذا العضو (رتبته أعلى).");
            await member.kick(reason);
            await i.editReply(`✅ تم طرد ${member.user.tag} بسبب: ${reason}`);
        }

        // [3] أمر الباند
        else if (i.commandName === 'ban') {
            const member = i.options.getMember('عضو');
            const reason = i.options.getString('سبب');
            if (!member.bannable) return i.editReply("❌ لا يمكنني حظر هذا العضو.");
            await member.ban({ reason });
            await i.editReply(`🚫 تم حظر ${member.user.tag} نهائياً.`);
        }

        // [4] أمر التبليغ
        else if (i.commandName === 'report') {
            const member = i.options.getMember('عضو');
            const reason = i.options.getString('السبب');
            const channel = i.guild.channels.cache.get(REPORT_CHANNEL);
            if (channel) {
                const reportEmbed = new EmbedBuilder()
                    .setTitle("📢 بلاغ جديد للإدارة")
                    .setColor(0xFFFF00)
                    .addFields(
                        { name: "المُبلَغ عنه", value: `${member.user.tag}`, inline: true },
                        { name: "المُبلِغ", value: `${i.user.tag}`, inline: true },
                        { name: "السبب", value: reason }
                    );
                await channel.send({ embeds: [reportEmbed] });
                await i.editReply("✅ تم إرسال بلاغك بنجاح.");
            }
        }
    } catch (e) {
        console.error(e);
        await i.editReply("❌ حدث خطأ غير متوقع.");
    }
});

// --- مراقبة الرسائل (الفلتر) ---
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;
    const badWords = ["زق", "كلب", "خرا"]; // أضف الكلمات هنا
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        const logs = m.guild.channels.cache.get(LOGS_CHANNEL);
        if (logs) {
            logs.send(`⚠️ تم حذف رسالة مخالفة للعضو: ${m.author.tag}`);
        }
    }
});

client.login(TOKEN);
