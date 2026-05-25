import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes, PermissionFlagsBits, ActivityType, Colors } from 'discord.js';

// --- إعدادات البوت والـ Intents ---
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

// --- قائمة الأوامر (Slash Commands Definition) ---
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('عرض سرعة استجابة البوت'),
    new SlashCommandBuilder().setName('clear').setDescription('حذف مجموعة رسائل').addIntegerOption(o => o.setName('count').setDescription('العدد').setRequired(true)),
    new SlashCommandBuilder().setName('serverinfo').setDescription('معلومات تفصيلية عن السيرفر'),
    new SlashCommandBuilder().setName('userinfo').setDescription('معلومات العضو').addUserOption(o => o.setName('user').setDescription('اختر العضو')),
    new SlashCommandBuilder().setName('ban').setDescription('حظر عضو').addUserOption(o => o.setName('target').setRequired(true).setDescription('العضو')).addStringOption(o => o.setName('reason').setDescription('السبب')),
    new SlashCommandBuilder().setName('avatar').setDescription('عرض صورة العضو').addUserOption(o => o.setName('user').setDescription('العضو')),
    new SlashCommandBuilder().setName('uptime').setDescription('مدة تشغيل البوت')
];

// --- حدث التشغيل وتسجيل الأوامر ---
client.once('ready', async () => {
    console.log(`✅ البوت متصل كـ ${client.user?.tag}`);
    client.user?.setActivity('نظام حماية متطور', { type: ActivityType.Watching });
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
});

// --- نظام مراقبة الرسائل (الفلتر + اللوج في الكونسول) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // نظام الفلتر
    const badWords = ['شتم', 'مخالفة', 'روابط_غير_مرغوبة'];
    if (badWords.some(word => message.content.toLowerCase().includes(word))) {
        await message.delete().catch(() => {});
        console.log(`[FILTER] تم حذف رسالة من ${message.author.tag} بسبب محتوى مخالف.`);
    }

    // تسجيل أي نشاط في الكونسول (Logging)
    console.log(`[MESSAGE] ${message.author.tag}: ${message.content}`);
});

// --- نظام معالجة الأوامر (Command Handler Logic) ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // 1. أمر Ping
    if (interaction.commandName === 'ping') {
        await interaction.reply(`🏓 البينج: ${client.ws.ping}ms`);
    }

    // 2. أمر Clear
    else if (interaction.commandName === 'clear') {
        const count = interaction.options.getInteger('count')!;
        const deleted = await interaction.channel?.bulkDelete(count, true);
        await interaction.reply({ content: `✅ تم مسح ${deleted?.size} رسالة بنجاح.`, ephemeral: true });
    }

    // 3. أمر ServerInfo
    else if (interaction.commandName === 'serverinfo') {
        const embed = new EmbedBuilder()
            .setTitle(`معلومات ${interaction.guild?.name}`)
            .setColor(Colors.Blue)
            .addFields(
                { name: 'عدد الأعضاء', value: `${interaction.guild?.memberCount}`, inline: true },
                { name: 'المالك', value: `<@${interaction.guild?.ownerId}>`, inline: true },
                { name: 'تاريخ الإنشاء', value: interaction.guild?.createdAt.toDateString() || 'N/A' }
            );
        await interaction.reply({ embeds: [embed] });
    }

    // 4. أمر UserInfo
    else if (interaction.commandName === 'userinfo') {
        const user = interaction.options.getUser('user') || interaction.user;
        await interaction.reply(`👤 معلومات العضو: ${user.username} | الأيدي: ${user.id}`);
    }

    // 5. أمر Ban
    else if (interaction.commandName === 'ban') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) return;
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'لا يوجد سبب';
        await target?.ban({ reason: reason });
        await interaction.reply(`🔨 تم حظر ${target?.user.tag}`);
    }

    // 6. أمر Avatar
    else if (interaction.commandName === 'avatar') {
        const user = interaction.options.getUser('user') || interaction.user;
        await interaction.reply(user.displayAvatarURL({ size: 1024 }));
    }

    // 7. أمر Uptime
    else if (interaction.commandName === 'uptime') {
        const totalSeconds = (client.uptime! / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        await interaction.reply(`⏳ يعمل منذ ${hours} ساعة.`);
    }
});

// --- نظام مراقبة النظام الدوري ---
setInterval(() => {
    const memory = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[HEALTH] استهلاك الذاكرة: ${memory.toFixed(2)} MB`);
}, 600000);

// تسجيل دخول البوت
client.login(TOKEN);
