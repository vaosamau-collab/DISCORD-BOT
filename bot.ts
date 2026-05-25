// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const commands = [
  { name: 'ping', description: 'يرد عليك بكلمة Pong!' },
  { name: 'ban', description: 'طرد نهائي', options: [{ name: 'user', type: 6, description: 'العضو', required: true }] },
  { name: 'kick', description: 'ركل عضو', options: [{ name: 'user', type: 6, description: 'العضو', required: true }] },
  { name: 'image', description: 'توليد صورة', options: [{ name: 'prompt', type: 3, description: 'وصف الصورة', required: true }] },
  { name: 'say', description: 'يجعل البوت يتكلم', options: [{ name: 'text', type: 3, description: 'الكلام المطلوب', required: true }] }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const bannedWords = ["سب", "شتم", "ممنوع"];

client.once(Events.ClientReady, async () => {
    await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
    console.log('البوت شغال بكل الأوامر يا أسامة!');
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') await interaction.reply('Pong!');

    if (interaction.commandName === 'ban') {
        const member = interaction.options.getMember('user');
        await member.ban();
        await interaction.reply(`تم طرد ${member.user.tag}`);
    }

    if (interaction.commandName === 'kick') {
        const member = interaction.options.getMember('user');
        await member.kick();
        await interaction.reply(`تم ركل ${member.user.tag}`);
    }

    if (interaction.commandName === 'say') {
        const text = interaction.options.getString('text');
        await interaction.channel.send(text);
        await interaction.reply({ content: 'تم الإرسال!', ephemeral: true });
    }

    if (interaction.commandName === 'image') {
        await interaction.deferReply();
        try {
            const response = await openai.images.generate({ model: "dall-e-3", prompt: interaction.options.getString('prompt'), n: 1, size: "1024x1024" });
            await interaction.editReply(response.data[0].url);
        } catch (e) { await interaction.editReply('خطأ: تأكد من مفتاح الـ OpenAI!'); }
    }
});

client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;
    if (bannedWords.some(word => message.content.includes(word))) {
        message.delete();
        message.channel.send(`${message.author.username}، ممنوع استخدام هذه الكلمة!`);
    }
});

client.login(process.env.DISCORD_TOKEN);
