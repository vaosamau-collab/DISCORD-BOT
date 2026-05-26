// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, PermissionsBitField, Interaction } from 'discord.js';
import * as fs from 'fs';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ] 
});

// إعدادات النظام
const CONFIG = {
    token: process.env.DISCORD_TOKEN,
    clientId: "1507868881597759510",
    logsChannel: "1508527170039976026",
    reportChannel: "1508764694834450452"
};

// --- تسجيل أوامر السلاش (كل الأوامر في مكان واحد) ---
const commands = [
    { name: 'help', description: 'عرض قائمة الأوامر' },
    { name: 'kick', description: 'طرد عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'سبب', type: 3, required: true }] },
    { name: 'ban', description: 'حظر عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'سبب', type: 3, required: true }] },
    { name: 'warn', description: 'تحذير عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'سبب', type: 3, required: true }] },
    { name: 'report', description: 'تقديم بلاغ', options: [{ name: 'عضو', type: 6, required: true }, { name: 'السبب', type: 3, required: true }] }
];

client.once('ready', async (c) => {
    const rest = new REST({ version: '10' }).setToken(CONFIG.token);
    await rest.put(Routes.applicationCommands(CONFIG.clientId), { body: commands });
    console.log(`✅ النظام جاهز: ${c.user.tag}`);
});

// --- معالج التفاعلات (الإدارة + الهيلب) ---
client.on('interactionCreate', async (i: Interaction) => {
    if (!i.isChatInputCommand()) return;
    await i.deferReply({ ephemeral: true });

    try {
        const { commandName, options } = i;

        // أمر الهيلب (موسع)
        if (commandName === 'help') {
            const embed = new EmbedBuilder()
                .setTitle("🛡️ مركز تحكم أسامة")
                .setColor(0x00AAFF)
                .addFields(
                    { name: "🔨 الإدارة", value: "`/kick` - طرد\n`/ban` - حظر\n`/warn` - تحذير" },
                    { name: "📢 البلاغات", value: "`/report` - التبليغ عن مخالفة" }
                );
            await i.editReply({ embeds: [embed] });
        }

        // أوامر الإدارة (الباند والكيك والتحذير)
        if (commandName === 'kick') {
            const member = options.getMember('عضو');
            await member.kick(options.getString('سبب'));
            await i.editReply(`🔨 تم طرد ${member.user.tag}`);
        }

        if (commandName === 'ban') {
            const member = options.getMember('عضو');
            await member.ban({ reason: options.getString('سبب') });
            await i.editReply(`🚫 تم حظر ${member.user.tag}`);
        }

        if (commandName === 'warn') {
            const member = options.getMember('عضو');
            const reason = options.getString('سبب');
            // هنا يمكنك إضافة كود حفظ التحذير في JSON
            await i.editReply(`⚠️ تم تحذير ${member.user.tag} بسبب: ${reason}`);
        }

        if (commandName === 'report') {
            const member = options.getMember('عضو');
            const reason = options.getString('السبب');
            const reportChan = i.guild.channels.cache.get(CONFIG.reportChannel);
            await reportChan.send(`📢 **بلاغ جديد:**\nالعضو: ${member.user.tag}\nالسبب: ${reason}`);
            await i.editReply("✅ تم إرسال بلاغك للإدارة.");
        }
    } catch (e) {
        await i.editReply("❌ حدث خطأ، تأكد من الصلاحيات.");
    }
});

client.login(CONFIG.token);
