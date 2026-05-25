// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const commands = [{ name: 'ping', description: 'يرد عليك بكلمة Pong!' }];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, async () => {
    console.log('البوت شغال يا أسامة!');
    try {
        console.log('جاري تسجيل أوامر السلاش...');
        await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
        console.log('تم تسجيل الأوامر!');
    } catch (error) { console.error(error); }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'ping') await interaction.reply('Pong!');
});

client.on(Events.MessageCreate, (message) => {
    if (message.content === '!ping') message.reply('Pong!');
});

client.login(process.env.DISCORD_TOKEN);
