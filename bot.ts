// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const commands = [
  { name: 'ping', description: 'يرد عليك بكلمة Pong!' },
  { name: 'ban', description: 'طرد عضو', options: [{ name: 'user', type: 6, description: 'العضو', required: true }] },
  { name: 'kick', description: 'ركل عضو', options: [{ name: 'user', type: 6, description: 'العضو', required: true }] }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
let bannedWords = ["كلمة1", "كلمة2"]; // هنا تضيف الكلمات المحظورة

client.once(Events.ClientReady, async () => {
    await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
    console.log('البوت جاهز بكل الأوامر!');
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
});

// نظام الكلمات المحظورة
client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;
    if (bannedWords.some(word => message.content.includes(word))) {
        message.delete();
        message.channel.send(`${message.author.username}، ممنوع استخدام هذه الكلمة!`);
    }
});

client.login(process.env.DISCORD_TOKEN);
