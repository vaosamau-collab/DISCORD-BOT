// @ts-nocheck
const { Client, GatewayIntentBits, Events } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, () => {
    console.log('البوت شغال يا أسامة!');
});

client.on(Events.MessageCreate, (message) => {
    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});

client.login(process.env.DISCORD_TOKEN);
