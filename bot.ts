// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ] 
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const WELCOME_CHANNEL_ID = "1508087523820310578"; 
const LOGS_CHANNEL_ID = "1508091945883275495"; 
let bannedWords = ["سب", "شتم", "ممنوع"];
const warnings = new Map(); 

const commands = [
  { name: 'ping', description: 'يرد عليك بكلمة Pong!' },
  { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, description: 'عدد الرسائل (1-100)', required: true }] },
  { name: 'قفل', description: 'قفل الشات الحالي' },
  { name: 'فتح', description: 'فتح الشات الحالي' },
  { name: 'حذر_سبه', description: 'إضافة كلمة للحظر', options: [{ name: 'كلمه', type: 3, description: 'الكلمة', required: true }] },
  { name: 'ازالت_سبه', description: 'إزالة كلمة من الحظر', options: [{ name: 'كلمه', type: 3, description: 'الكلمة', required: true }] },
  { name: 'كلمات', description: 'عرض قائمة الكلمات المحظورة' }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, async () => {
    await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
    console.log('البوت جاهز ونظام العقوبات التصاعدي مفعل!');
});

// الأوامر الإدارية
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'مسح') {
        const amount = interaction.options.getInteger('عدد');
        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({ content: `✅ تم مسح ${amount} رسالة!`, ephemeral: true });
    }
    if (interaction.commandName === 'قفل') {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
        await interaction.reply('🔒 تم قفل الشات!');
    }
    if (interaction.commandName === 'فتح') {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });
        await interaction.reply('🔓 تم فتح الشات!');
    }
    if (interaction.commandName === 'حذر_سبه') {
        bannedWords.push(interaction.options.getString('كلمه'));
        await interaction.reply('✅ تم الحظر.');
    }
    if (interaction.commandName === 'ازالت_سبه') {
        bannedWords = bannedWords.filter(w => w !== interaction.options.getString('كلمه'));
        await interaction.reply('🗑️ تم الإزالة.');
    }
    if (interaction.commandName === 'كلمات') await interaction.reply(`🚫 الكلمات: \`${bannedWords.join(', ')}\``);
});

// نظام العقوبات التصاعدي
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.member) return;
    const foundWord = bannedWords.find(word => message.content.toLowerCase().includes(word.toLowerCase()));

    if (foundWord) {
        await message.delete();
        const userId = message.author.id;
        const count = (warnings.get(userId) || 0) + 1;
        warnings.set(userId, count);

        let action = "";
        let duration = 0;

        if (count === 1) { duration = 5 * 60 * 1000; action = "كتم 5 دقائق"; }
        else if (count === 2) { duration = 1 * 60 * 60 * 1000; action = "كتم 1 ساعة"; }
        else if (count === 3) { duration = 5 * 60 * 60 * 1000; action = "كتم 5 ساعات"; }
        else if (count === 4) { duration = 7 * 60 * 60 * 1000; action = "كتم 7 ساعات"; }
        else { duration = 48 * 60 * 60 * 1000; action = "كتم 48 ساعة"; warnings.set(userId, 0); }

        await message.member.timeout(duration, "مخالفة سب متكررة");
        message.channel.send(`${message.author}، **المخالفة ${count}**: تم تنفيذ العقوبة (${action}).`);

        const logsChannel = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (logsChannel) logsChannel.send(`⚠️ مخالفة: ${message.author.tag} | العقوبة: ${action}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
