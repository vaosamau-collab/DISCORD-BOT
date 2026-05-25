// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const commands = [
  { name: 'ping', description: 'يرد عليك بكلمة Pong!' },
  { name: 'ban', description: 'طرد نهائي', options: [{ name: 'user', type: 6, description: 'العضو', required: true }] },
  { name: 'kick', description: 'ركل عضو', options: [{ name: 'user', type: 6, description: 'العضو', required: true }] },
  { name: 'image', description: 'توليد صورة بالذكاء الاصطناعي', options: [{ name: 'prompt', type: 3, description: 'وصف الصورة', required: true }] }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const bannedWords = ["سب", "شتم", "ممنوع"]; // أضف كلماتك هنا

client.once(Events.ClientReady, async () => {
    await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
    console.log('البوت شغال بكل الأوامر!');
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

    if (interaction.commandName === 'image') {
        await interaction.deferReply();
        try {
            const response = await openai.images.generate({ model: "dall-e-3", prompt: interaction.options.getString('prompt'), n: 1, size: "1024x1024" });
            await interaction.editReply(response.data[0].url);
        } catch (e) { await interaction.editReply('مالك دخل'); }
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
