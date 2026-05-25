import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionFlagsBits, ActivityType, Colors } from 'discord.js';

// تهيئة البوت مع جميع الصلاحيات اللازمة
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildModeration
    ] 
});

const TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = 'YOUR_CLIENT_ID';

// --- 1. قائمة الأوامر المتقدمة ---
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('عرض سرعة استجابة البوت'),
    new SlashCommandBuilder().setName('clear').setDescription('حذف رسائل')
        .addIntegerOption(o => o.setName('count').setDescription('عدد الرسائل').setRequired(true)),
    new SlashCommandBuilder().setName('serverinfo').setDescription('معلومات مفصلة عن السيرفر'),
    new SlashCommandBuilder().setName('userinfo').setDescription('معلومات عضو')
        .addUserOption(o => o.setName('user').setDescription('اختر العضو')),
    new SlashCommandBuilder().setName('ban').setDescription('حظر عضو')
        .addUserOption(o => o.setName('target').setRequired(true).setDescription('العضو المراد حظره'))
        .addStringOption(o => o.setName('reason').setDescription('سبب الحظر'))
];

// --- 2. التشغيل ونظام الحالة التلقائي ---
client.once('ready', async () => {
    console.log(`✅ البوت متصل كـ ${client.user?.tag}`);
    client.user?.setActivity('نظام حماية متطور', { type: ActivityType.Watching });
    
    // تسجيل الأوامر في ديسكورد
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
});

// --- 3. نظام الفلترة الذكي (بدون رومات) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const badWords = ['شتم', 'مخالفة', 'روابط_غير_مرغوبة'];
    if (badWords.some(word => message.content.toLowerCase().includes(word))) {
        await message.delete().catch(() => {});
        const msg = await message.channel.send(`⚠️ ${message.author}، تم حذف رسالتك بسبب محتوى مخالف.`);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
    }
});

// --- 4. معالج التفاعلات (Slash Commands) ---
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
        await interaction.reply({ content: `✅ تم مسح ${deleted?.size} رسالة بنجاح.`, ephemeral: true });
    }

    // ServerInfo
    else if (interaction.commandName === 'serverinfo') {
        const embed = new EmbedBuilder()
            .setTitle(`معلومات ${interaction.guild?.name}`)
            .setColor(Colors.Blue)
            .setThumbnail(interaction.guild?.iconURL())
            .addFields(
                { name: 'الأعضاء', value: `${interaction.guild?.memberCount}`, inline: true },
                { name: 'المالك', value: `<@${interaction.guild?.ownerId}>`, inline: true },
                { name: 'تاريخ الإنشاء', value: interaction.guild?.createdAt.toDateString() || 'N/A' }
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    }

    // Ban
    else if (interaction.commandName === 'ban') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: 'ليس لديك صلاحية الحظر!', ephemeral: true });
        }
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب';
        await target?.ban({ reason: reason });
        await interaction.reply(`🔨 تم حظر ${target?.user.tag} بسبب: ${reason}`);
    }
});

// --- 5. نظام سجلات الأخطاء والحماية ---
client.on('error', console.error);
client.on('warn', console.warn);

// --- 6. نظام المراقبة الدورية (Health Check) ---
setInterval(() => {
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[HEALTH CHECK] البوت نشط | استهلاك الذاكرة: ${memoryUsage.toFixed(2)} MB`);
}, 600000);

client.login(TOKEN);
