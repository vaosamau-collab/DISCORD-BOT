import { 
    Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, 
    REST, Routes, PermissionFlagsBits, ActivityType, Colors, GuildMember 
} from 'discord.js';

// --- تهيئة العميل (Client) مع الصلاحيات ---
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

// --- تعريف الأوامر (Slash Commands) ---
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('عرض سرعة البوت'),
    new SlashCommandBuilder().setName('clear').setDescription('مسح رسائل').addIntegerOption(o => o.setName('count').setDescription('العدد').setRequired(true)),
    new SlashCommandBuilder().setName('serverinfo').setDescription('معلومات السيرفر'),
    new SlashCommandBuilder().setName('userinfo').setDescription('معلومات عضو').addUserOption(o => o.setName('user').setDescription('العضو')),
    new SlashCommandBuilder().setName('ban').setDescription('حظر عضو').addUserOption(o => o.setName('target').setRequired(true).setDescription('العضو')).addStringOption(o => o.setName('reason').setDescription('السبب')),
    new SlashCommandBuilder().setName('avatar').setDescription('صورة العضو').addUserOption(o => o.setName('user').setDescription('العضو')),
    new SlashCommandBuilder().setName('uptime').setDescription('مدة تشغيل البوت'),
    new SlashCommandBuilder().setName('kick').setDescription('طرد عضو').addUserOption(o => o.setName('target').setRequired(true).setDescription('العضو')),
    new SlashCommandBuilder().setName('help').setDescription('قائمة المساعدة')
];

// --- نظام تشغيل البوت ---
client.once('ready', async () => {
    console.log(`✅ البوت متصل كـ: ${client.user?.tag}`);
    client.user?.setActivity('نظام حماية وسيرفرات', { type: ActivityType.Watching });
    
    // تسجيل الأوامر
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
});

// --- نظام الفلترة (مُحسّن) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const badWords = ['شتم', 'خطر', 'ممنوع', 'سب'];
    const content = message.content.toLowerCase();
    
    if (badWords.some(word => content.includes(word))) {
        await message.delete().catch(() => {});
        console.log(`[FILTER] تم حذف رسالة مخالفة من: ${message.author.tag}`);
        const msg = await message.channel.send(`⚠️ ${message.author}، ممنوع استخدام هذه الكلمات.`);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
    }
});

// --- نظام التفاعل (Slash Commands Handler) ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // أمر Ping
    if (interaction.commandName === 'ping') {
        await interaction.reply(`🏓 البينج: ${client.ws.ping}ms`);
    }

    // أمر Clear
    else if (interaction.commandName === 'clear') {
        const count = interaction.options.getInteger('count')!;
        await interaction.channel?.bulkDelete(count, true);
        await interaction.reply({ content: `✅ تم مسح ${count} رسالة.`, ephemeral: true });
    }

    // أمر Ban
    else if (interaction.commandName === 'ban') {
        const target = interaction.options.getMember('target');
        if (target instanceof GuildMember) {
            await target.ban({ reason: interaction.options.getString('reason') || 'لا يوجد سبب' });
            await interaction.reply(`🔨 تم حظر ${target.user.tag}`);
        } else {
            await interaction.reply({ content: 'فشل العثور على العضو.', ephemeral: true });
        }
    }

    // أمر Kick
    else if (interaction.commandName === 'kick') {
        const target = interaction.options.getMember('target');
        if (target instanceof GuildMember) {
            await target.kick();
            await interaction.reply(`👢 تم طرد ${target.user.tag}`);
        }
    }

    // أمر ServerInfo
    else if (interaction.commandName === 'serverinfo') {
        const embed = new EmbedBuilder()
            .setTitle(`معلومات السيرفر: ${interaction.guild?.name}`)
            .setColor(Colors.Blue)
            .addFields(
                { name: 'عدد الأعضاء', value: `${interaction.guild?.memberCount}`, inline: true },
                { name: 'المالك', value: `<@${interaction.guild?.ownerId}>`, inline: true }
            );
        await interaction.reply({ embeds: [embed] });
    }

    // أمر Avatar
    else if (interaction.commandName === 'avatar') {
        const user = interaction.options.getUser('user') || interaction.user;
        await interaction.reply(user.displayAvatarURL({ size: 1024 }));
    }

    // أمر Uptime
    else if (interaction.commandName === 'uptime') {
        const hours = Math.floor(client.uptime! / 3600000);
        await interaction.reply(`⏳ يعمل منذ ${hours} ساعة.`);
    }

    // أمر Help
    else if (interaction.commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('قائمة الأوامر')
            .setDescription('هذه هي الأوامر المتاحة في البوت:')
            .addFields(
                { name: '/ping', value: 'عرض سرعة البوت' },
                { name: '/clear', value: 'مسح الرسائل' },
                { name: '/ban /kick', value: 'أوامر الإدارة' },
                { name: '/serverinfo', value: 'معلومات السيرفر' }
            );
        await interaction.reply({ embeds: [embed] });
    }
});

// --- نظام مراقبة النظام ---
setInterval(() => {
    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[STATUS] ذاكرة النظام: ${mem.toFixed(2)} MB`);
}, 600000);

client.login(TOKEN);
