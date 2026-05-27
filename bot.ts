// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionsBitField } from 'discord.js';

const client = new Client({ intents: [131071] });
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";
const TICKET_CHANNEL_ID = "1508764694834450452"; // الروم اللي حددته

client.once('ready', async () => {
    const commands = [
        new SlashCommandBuilder().setName('ping').setDescription('فحص السرعة'),
        new SlashCommandBuilder().setName('ticket').setDescription('فتح تذكرة دعم فني')
    ];
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ البوت العملاق جاهز ومفعل نظام التكت: ${client.user.tag}`);
});

client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;

    if (i.commandName === 'ticket') {
        const channelName = `ticket-${i.user.username}`;
        const ticketChannel = await i.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: null, // تقدر تحط ID التصنيف هنا لو تبي
            permissionOverwrites: [
                { id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });
        await i.reply({ content: `✅ تم فتح التكت الخاص بك في الروم: ${ticketChannel}`, ephemeral: true });
        ticketChannel.send(`👋 أهلاً ${i.user}، كيف نقدر نساعدك؟`);
    }

    if (i.commandName === 'ping') await i.reply(`⚡ البينج: ${client.ws.ping}ms`);
});

client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    // الفلتر اللي اعتمدناه
    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        m.channel.send(`⚠️ تم حذف رسالة مخالفة من ${m.author.username}`).then(msg => setTimeout(() => msg.delete(), 3000));
    }

    // أمر إغلاق التكت (اكتب !close في التكت)
    if (m.content === '!close' && m.channel.name.startsWith('ticket-')) {
        m.channel.send("🔒 جاري إغلاق التكت...");
        setTimeout(() => m.channel.delete(), 3000);
    }
});

client.login(TOKEN);
