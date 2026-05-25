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

// هنا أوامرك القديمة
client.on(Events.GuildMemberAdd, async (member) => {
    const channel = member.guild.channels.cache.get("1508087523820310578");
    if (channel && 'send' in channel) {
        channel.send(`🎉 هلا والله ${member} نورت السيرفر! أنت العضو رقم ${member.guild.memberCount} في ${member.guild.name} 🏆`);
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.content === '!ping') {
        message.reply('Pong!');
    }
    // يمكنك إضافة أوامر التحذير وغيرها هنا بنفس طريقة الـ if
});

client.login(process.env.DISCORD_TOKEN);
