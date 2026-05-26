// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ] 
});

// --- الإعدادات (الأيديات المعتمدة) ---
let bannedWords = ["سب", "شتم", "ممنوع", "زق", "كلب"];
const warnings = new Map();
const LOGS_CHANNEL_ID = "1508091945883275495";
const WELCOME_CHANNEL_ID = "1508087523820310578";
const GENERAL_CHANNEL_ID = "1507868881597759510";
const MY_ADMIN_ID = "1157314208988405760";

// --- أوامر النظام ---
const commands = [
    { name: 'ping', description: 'اختبار سرعة البوت' },
    { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, description: 'العدد', required: true }] },
    { name: 'قفل', description: 'إغلاق الشات' },
    { name: 'فتح', description: 'فتح الشات' },
    { name: 'إضافة_كلمة', description: 'إضافة كلمة للحظر', options: [{ name: 'كلمة', type: 3, description: 'الكلمة', required: true }] },
    { name: 'حذف_كلمة', description: 'حذف كلمة من الحظر', options: [{ name: 'كلمة', type: 3, description: 'الكلمة', required: true }] },
    { name: 'عرض_الكلمات', description: 'عرض الكلمات المحظورة' }
];

client.once(Events.ClientReady, async () => {
    console.log(`✅ النظام يعمل بكامل طاقته - أسامة: ${client.user.tag}`);
    // تفعيل الأوامر
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

// --- أوامر الإدارة (صلاحية خاصة لك فقط) ---
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.user.id !== MY_ADMIN_ID) return interaction.reply({ content: "🚫 أنت لست المطور!", ephemeral: true });

    if (interaction.commandName === 'مسح') {
        const count = interaction.options.getInteger('عدد');
        await interaction.channel.bulkDelete(count, true);
        await interaction.reply({ content: `✅ تم مسح ${count} رسالة.`, ephemeral: true });
    } else if (interaction.commandName === 'قفل') {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
        await interaction.reply('🔒 تم قفل الشات.');
    } else if (interaction.commandName === 'فتح') {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });
        await interaction.reply('🔓 تم فتح الشات.');
    } else if (interaction.commandName === 'إضافة_كلمة') {
        bannedWords.push(interaction.options.getString('كلمة'));
        await interaction.reply('✅ تمت الإضافة.');
    } else if (interaction.commandName === 'حذف_كلمة') {
        bannedWords = bannedWords.filter(w => w !== interaction.options.getString('كلمة'));
        await interaction.reply('🗑️ تمت الإزالة.');
    } else if (interaction.commandName === 'عرض_الكلمات') {
        await interaction.reply(`🚫 الكلمات: \`${bannedWords.join(', ')}\``);
    }
});

// --- نظام الحماية والترحيب ---
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.member) return;

    // حماية السب
    const found = bannedWords.find(w => message.content.toLowerCase().includes(w.toLowerCase()));
    if (found) {
        await message.delete().catch(() => {});
        try { await message.author.send(`⚠️ **تنبيه:** تم حذف رسالتك في الشات العام بسبب كلمة مخالفة: "${found}"`); } catch (e) {}

        const warnMsg = await message.channel.send(`🛑 **${message.author.username}**، تم حذف رسالتك لمخالفتها القوانين.`);
        setTimeout(() => warnMsg.delete().catch(() => {}), 5000);

        const logs = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (logs) {
            const embed = new EmbedBuilder()
                .setTitle("🚨 رصد مخالفة سب")
                .setColor(0xFF0000)
                .addFields(
                    { name: "👤 العضو:", value: message.author.tag },
                    { name: "🚫 الكلمة:", value: `||${found}||` },
                    { name: "🕒 الوقت:", value: `<t:${Math.floor(Date.now() / 1000)}:R>` }
                );
            logs.send({ embeds: [embed] });
        }
    }
});

// ترحيب تلقائي
client.on(Events.GuildMemberAdd, (m) => {
    const welcome = m.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (welcome) welcome.send(`يا هلا ${m} في سيرفر أسامة! نورت المكان.`);
});

// مراقبة النشاط (Heartbeat)
setInterval(() => {
    console.log("🛠️ النظام تحت المراقبة...");
}, 600000);

process.on('unhandledRejection', console.error);
client.login(process.env.DISCORD_TOKEN);
