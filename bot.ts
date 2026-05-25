// @ts-nocheck
import { Client, GatewayIntentBits, Events } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.on(Events.ClientReady, () => {
    console.log(`البوت شغال يا أسامة!`);
});

// هذا هو أمر البينج اللي سألت عنه، إذا كتبته في الديسكورد بيرد عليك
client.on(Events.MessageCreate, async (message) => {
    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});

client.login(process.env.DISCORD_TOKEN);
