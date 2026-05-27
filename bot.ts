import { 
    Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, 
    REST, Routes, PermissionFlagsBits, ActivityType, Colors, GuildMember, Interaction 
} from 'discord.js';

// --- إعداد العميل ---
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildModeration
    ] 
});

const TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = 'YOUR_CLIENT_ID';

// --- قائمة الأوامر ---
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('عرض سرعة البوت'),
    new SlashCommandBuilder().setName('clear').setDescription('مسح رسائل').addIntegerOption(o => o.setName('count').setDescription('العدد').setRequired(true)),
    new SlashCommandBuilder().setName('serverinfo').setDescription('معلومات السيرفر'),
    new SlashCommandBuilder().setName('userinfo').setDescription('معلومات عضو').addUserOption(o => o.setName('user').setDescription('العضو')),
    new SlashCommandBuilder().setName('ban').setDescription('حظر عضو').addUserOption(o => o.setName('target').setRequired(true).setDescription('العضو')).addStringOption(o => o.setName('reason').setDescription('السبب')),
    new SlashCommandBuilder().setName('avatar').setDescription('صورة العضو').addUserOption(o => o.setName('user').setDescription('العضو')),
    new SlashCommandBuilder().setName('uptime').setDescription('مدة عمل البوت'),
    new SlashCommandBuilder().setName('kick').setDescription('طرد عضو').addUserOption(o => o.setName('target').setRequired(true).setDescription('العضو')),
    new SlashCommandBuilder().setName('help').setDescription('قائمة المساعدة')
];

// --- دوال الأوامر (لزيادة طول الكود وتنظيمه) ---
async function handleBan(interaction: any) {
    const target = interaction.options.getMember('target');
    if (!(target instanceof GuildMember)) return interaction.reply({ content: 'عضو غير موجود', ephemeral: true });
    await target.ban({ reason: interaction.options.getString('reason') || 'لا يوجد سبب' });
    await interaction.reply(`🔨 تم حظر ${target.user.tag}`);
}

async function handleClear(interaction: any) {
    const count = interaction.options.getInteger('count');
    const deleted = await interaction.channel?.bulkDelete(count!, true);
    await interaction.reply({ content: `✅ تم مسح ${deleted?.size} رسالة.`, ephemeral: true });
}

async function handleServerInfo(interaction: any) {
    const embed = new EmbedBuilder()
        .setTitle(`معلومات السيرفر: ${interaction.guild?.name}`)
        .setColor(Colors.Blue)
        .addFields(
            { name: 'الأعضاء', value: `${interaction.guild?.memberCount}`, inline: true },
            { name: 'المالك', value: `<@${interaction.guild?.ownerId}>`, inline: true },
            { name: 'التعزيزات', value: `${interaction.guild?.premiumSubscriptionCount || 0}`, inline: true }
        );
    await interaction.reply({ embeds: [embed] });
}

// --- نظام الفلترة المتقدم ---
async function processMessageFilter(message: any) {
    const badWords = ['شتم', 'خطر', 'ممنوع', 'سب'];
    if (badWords.some(word => message.content.toLowerCase().includes(word))) {
        await message.delete().catch(() => {});
        console.log(`[FILTER] تم حذف رسالة من: ${message.author.tag}`);
        const msg = await message.channel.send(`⚠️ ${message.author}، ممنوع استخدام هذه الكلمات.`);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
    }
}

// --- تشغيل البوت ---
client.once('ready', async () => {
    console.log(`✅ البوت متصل كـ: ${client.user?.tag}`);
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
});

client.on('messageCreate', processMessageFilter);

client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    switch (interaction.commandName) {
        case 'ping': await interaction.reply(`🏓 البينج: ${client.ws.ping}ms`); break;
        case 'clear': await handleClear(interaction); break;
        case 'ban': await handleBan(interaction); break;
        case 'serverinfo': await handleServerInfo(interaction); break;
        case 'avatar': 
            const user = interaction.options.getUser('user') || interaction.user;
            await interaction.reply(user.displayAvatarURL({ size: 1024 }));
            break;
        case 'uptime':
            const h = Math.floor(client.uptime! / 3600000);
            await interaction.reply(`⏳ يعمل منذ ${h} ساعة.`);
            break;
        case 'kick':
            const target = interaction.options.getMember('target');
            if (target instanceof GuildMember) {
                await target.kick();
                await interaction.reply(`👢 تم طرد ${target.user.tag}`);
            }
            break;
        case 'help':
            await interaction.reply('قائمة المساعدة: استخدم الأوامر المتاحة أعلاه!');
            break;
    }
});

// --- سجلات النشاط (Logging) ---
client.on('guildMemberAdd', (member) => {
    console.log(`[NEW MEMBER] ${member.user.tag} انضم للسيرفر.`);
});

client.on('guildMemberRemove', (member) => {
    console.log(`[LEFT MEMBER] ${member.user.tag} غادر السيرفر.`);
});

// --- مراقبة النظام ---
setInterval(() => {
    console.log(`[STATUS] ذاكرة النظام: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
}, 600000);

client.login(TOKEN);
