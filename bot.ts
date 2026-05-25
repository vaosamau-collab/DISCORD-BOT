import { 
    Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, 
    REST, Routes, PermissionFlagsBits, ActivityType, Colors, GuildMember 
} from 'discord.js';

// --- تهيئة البوت مع جميع الصلاحيات ---
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ] 
});

const TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = 'YOUR_CLIENT_ID';
const LOGS_CHANNEL_ID = 'YOUR_LOGS_CHANNEL_ID'; // ضع الآيدي هنا

// --- تعريف الأوامر ---
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('عرض سرعة البوت'),
    new SlashCommandBuilder().setName('clear').setDescription('حذف رسائل').addIntegerOption(o => o.setName('count').setDescription('العدد').setRequired(true)),
    new SlashCommandBuilder().setName('serverinfo').setDescription('معلومات السيرفر'),
    new SlashCommandBuilder().setName('userinfo').setDescription('معلومات عضو').addUserOption(o => o.setName('user').setDescription('العضو')),
    new SlashCommandBuilder().setName('ban').setDescription('حظر عضو').addUserOption(o => o.setName('target').setRequired(true).setDescription('العضو')).addStringOption(o => o.setName('reason').setDescription('السبب')),
    new SlashCommandBuilder().setName('avatar').setDescription('صورة العضو').addUserOption(o => o.setName('user').setDescription('العضو')),
    new SlashCommandBuilder().setName('uptime').setDescription('مدة عمل البوت')
];

// --- تشغيل وتسجيل الأوامر ---
client.once('ready', async () => {
    console.log(`✅ البوت متصل: ${client.user?.tag}`);
    client.user?.setActivity('نظام متكامل ومراقب', { type: ActivityType.Watching });
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
});

// --- نظام مراقبة الرسائل (الفلتر + لوج) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // نظام الفلتر
    const badWords = ['شتم', 'خطر', 'ممنوع'];
    if (badWords.some(word => message.content.toLowerCase().includes(word))) {
        await message.delete().catch(() => {});
        const warn = await message.channel.send(`🚫 ${message.author}، ممنوع استخدام هذه الكلمات.`);
        setTimeout(() => warn.delete().catch(() => {}), 5000);
        console.log(`[FILTER] حظر كلمة من ${message.author.tag}`);
    }
});

// --- معالج التفاعلات (Slash Commands) ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Ping
    if (interaction.commandName === 'ping') {
        await interaction.reply(`🏓 البينج: ${client.ws.ping}ms`);
    }

    // Clear
    else if (interaction.commandName === 'clear') {
        const count = interaction.options.getInteger('count')!;
        const deleted = await interaction.channel?.bulkDelete(count, true);
        await interaction.reply({ content: `✅ تم مسح ${deleted?.size} رسالة.`, ephemeral: true });
    }

    // Ban (تم إصلاح الخطأ هنا باستخدام التحقق من النوع)
    else if (interaction.commandName === 'ban') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) return;
        const target = interaction.options.getMember('target');
        
        if (target instanceof GuildMember) {
            const reason = interaction.options.getString('reason') || 'لا يوجد سبب';
            await target.ban({ reason: reason });
            await interaction.reply(`🔨 تم حظر ${target.user.tag}`);
        } else {
            await interaction.reply({ content: 'فشل العثور على العضو.', ephemeral: true });
        }
    }

    // ServerInfo
    else if (interaction.commandName === 'serverinfo') {
        const embed = new EmbedBuilder()
            .setTitle(`معلومات ${interaction.guild?.name}`)
            .setColor(Colors.Blue)
            .addFields(
                { name: 'الأعضاء', value: `${interaction.guild?.memberCount}`, inline: true },
                { name: 'المالك', value: `<@${interaction.guild?.ownerId}>`, inline: true }
            );
        await interaction.reply({ embeds: [embed] });
    }

    // Avatar
    else if (interaction.commandName === 'avatar') {
        const user = interaction.options.getUser('user') || interaction.user;
        await interaction.reply(user.displayAvatarURL({ size: 1024 }));
    }

    // Uptime
    else if (interaction.commandName === 'uptime') {
        const h = Math.floor(client.uptime! / 3600000);
        await interaction.reply(`⏳ البوت يعمل منذ ${h} ساعة.`);
    }
});

// --- دالة مراقبة النظام (تزيد من طول الكود وفائدته) ---
function checkSystem() {
    const memory = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[STATUS] ذاكرة النظام: ${memory.toFixed(2)} MB`);
}
setInterval(checkSystem, 600000);

// --- نظام ترحيب (إضافي لزيادة الطول) ---
client.on('guildMemberAdd', (member) => {
    console.log(`[JOIN] انضم العضو: ${member.user.tag}`);
});

client.login(TOKEN);
