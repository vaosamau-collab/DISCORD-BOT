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
  { name: 'image', description: 'توليد صورة', options: [{ name: 'prompt', type: 3, description: 'وصف الصورة', required: true }] },
  { name: 'say', description: 'يجعل البوت يتكلم', options: [{ name: 'text', type: 3, description: 'الكلام المطلوب', required: true }] },
  { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, description: 'عدد الرسائل (1-100)', required: true }] },
  { name: 'حذر_سبه', description: 'إضافة كلمة للحظر', options: [{ name: 'كلمه', type: 3, description: 'الكلمة', required: true }] },
  { name: 'ازالت_سبه', description: 'إزالة كلمة من الحظر', options: [{ name: 'كلمه', type: 3, description: 'الكلمة', required: true }] },
  { name: 'كلمات', description: 'عرض قائمة الكلمات المحظورة' }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, async () => {
    await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
    console.log('البوت جاهز ومفعل نظام الحماية!');
});

// الترحيب
client.on(Events.GuildMemberAdd, member => {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (channel) channel.send(`أهلاً بك يا ${member.user} في سيرفرنا! نورتنا يا بطل! 🎉`);
});

// الأوامر (Slash Commands)
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
        await interaction.reply(`🚫 الكلمات المحظورة:\n\`${bannedWords.join(', ')}\``);
    }
    if (interaction.commandName === 'image') {
        await interaction.deferReply();
        try {
            const response = await openai.images.generate({ model: "dall-e-3", prompt: interaction.options.getString('prompt'), n: 1, size: "1024x1024" });
            await interaction.editReply(response.data[0].url);
        } catch (e) { await interaction.editReply('خطأ: تأكد من مفتاح الـ OpenAI!'); }
    }
});

// نظام الحماية والسجلات مع كشف الأخطاء
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    const msgContent = message.content.toLowerCase();
    const foundWord = bannedWords.find(word => msgContent.includes(word.toLowerCase()));

    if (foundWord) {
        try {
            await message.delete();
        } catch (error) {
            console.error("فشل حذف الرسالة في الـ Thread:", error);
            message.channel.send(`⚠️ لا أستطيع حذف الرسالة! تأكد من صلاحية Manage Messages في هذا الروم.`);
        }

        const warning = await message.channel.send(`${message.author}، ممنوع استخدام كلمة **${foundWord}**!`);
        setTimeout(() => warning.delete(), 5000);

        const logsChannel = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (logsChannel) {
            logsChannel.send(`⚠️ **مخالفة سب**\nالعضو: ${message.author.tag}\nالكلمة: ${foundWord}\nالوقت: ${new Date().toLocaleString()}`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
