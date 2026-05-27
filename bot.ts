// @ts-nocheck
import { Client, GatewayIntentBits, EmbedBuilder, ChannelType, PermissionsBitField } from 'discord.js';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

client.once('ready', () => {
    console.log(`✅ البوت مستقر ويعمل الآن: ${client.user.tag}`);
    client.user.setActivity('نظام أسامة | لا كراش بعد اليوم 🛡️');
});

client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    // 1. نظام الفلتر (يعمل دائماً وبدون أخطاء)
    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        const logChannel = m.guild.channels.cache.get("1508091945883275495");
        if (logChannel) {
            logChannel.send(`🚨 **مخالفة مرصودة**\nالمخالف: ${m.author.tag}\nالرسالة المحذوفة: ${m.content}`);
        }
        return;
    }

    // 2. نظام الأوامر النصية (بديل السلاش لمنع الكراش)
    if (!m.content.startsWith('!')) return;
    const args = m.content.slice(1).split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === 'ping') m.reply('البوت يعمل بكامل طاقته! 🚀');

    if (cmd === 'ticket') {
        const ticket = await m.guild.channels.create({
            name: `tkt-${m.author.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: m.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: m.author.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });
        m.reply(`✅ تم فتح التكت: ${ticket}`);
    }

    if (cmd === 'clear') {
        const n = parseInt(args[0]) || 1;
        await m.channel.bulkDelete(n, true).catch(() => {});
        m.channel.send("🧹 تم التنظيف.").then(msg => setTimeout(() => msg.delete(), 2000));
    }
});

client.login(process.env.DISCORD_TOKEN);
