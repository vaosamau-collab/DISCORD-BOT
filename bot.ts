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

const commands = [
  { name: 'ping', description: 'يرد عليك بكلمة Pong!' },
  { name: 'say', description: 'يجعل البوت يتكلم', options: [{ name: 'text', type: 3, description: 'الكلام المطلوب', required: true }] },
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
    console.log('البوت جاهز يا أسامة بكل الأوامر!');
});

// الترحيب
client.on(Events.GuildMemberAdd, member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (channel) channel.send(`أهلاً بك يا ${member.user} في سيرفرنا! نورتنا يا بطل! 🎉`);
});

// الأوامر
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') await interaction.reply('Pong!');
    
    if (interaction.commandName === 'say') {
        await interaction.channel.send(interaction.options.getString('text'));
        await interaction.reply({ content: 'تم الإرسال!', ephemeral: true });
    }

    if (interaction.commandName === 'مسح') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return await interaction.reply({ content: 'لا تملك صلاحية!', ephemeral: true });
        const amount = interaction.options.getInteger('عدد');
        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({ content: `✅ تم مسح ${amount} رسالة!`, ephemeral: true });
    }

    // القفل والفتح
    if (interaction.commandName === 'قفل') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return await interaction.reply({ content: 'لا تملك صلاحية!', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
        await interaction.reply('🔒 تم قفل الشات!');
    }

    if (interaction.commandName === 'فتح') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return await interaction.reply({ content: 'لا تملك صلاحية!', ephemeral: true });
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });
        await interaction.reply('🔓 تم فتح الشات!');
    }

    // الحماية
    if (interaction.commandName === 'حذر_سبه') {
        const word = interaction.options.getString('كلمه');
        bannedWords.push(word);
        await interaction.reply(`✅ تم حظر كلمة: **${word}**`);
    }

    if (interaction.commandName === 'ازالت_سبه') {
        const word = interaction.options.getString('كلمه');
        bannedWords = bannedWords.filter(w => w !== word);
        await interaction.reply(`🗑️ تم إزالة كلمة: **${word}**`);
    }

    if (interaction.commandName === 'كلمات') {
        await interaction.reply(`🚫 قائمة الكلمات المحظورة:\n\`${bannedWords.join(', ')}\``);
    }
});

// الحماية والسجلات
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    const foundWord = bannedWords.find(word => message.content.toLowerCase().includes(word.toLowerCase()));

    if (foundWord) {
        try {
            await message.delete();
            const warning = await message.channel.send(`${message.author}، ممنوع استخدام كلمة **${foundWord}**!`);
            setTimeout(() => warning.delete(), 5000);

            const logsChannel = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
            if (logsChannel) {
                logsChannel.send(`⚠️ **مخالفة سب**\nالعضو: ${message.author.tag}\nالكلمة: ${foundWord}\nالوقت: ${new Date().toLocaleString()}`);
            }
        } catch (error) {
            console.error("خطأ:", error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
