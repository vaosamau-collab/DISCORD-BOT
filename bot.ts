// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChannelType, PermissionsBitField, EmbedBuilder } from 'discord.js';

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

// --- 1. تسجيل الأوامر (Slash Commands) ---
client.once('ready', async () => {
    const commands = [
        new SlashCommandBuilder().setName('ping').setDescription('فحص سرعة البوت'),
        new SlashCommandBuilder().setName('ticket').setDescription('فتح تذكرة دعم فني'),
        new SlashCommandBuilder().setName('clear').setDescription('حذف رسائل')
            .addIntegerOption(o => o.setName('amount').setDescription('عدد الرسائل').setRequired(true)),
        new SlashCommandBuilder().setName('ban').setDescription('حظر عضو')
            .addUserOption(o => o.setName('target').setDescription('العضو المراد حظره').setRequired(true))
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ النظام الشامل يعمل الآن: ${client.user.tag}`);
});

// --- 2. معالجة أوامر السلاش (/) ---
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;

    if (i.commandName === 'ping') await i.reply({ content: `البينج: ${client.ws.ping}ms 🚀`, ephemeral: true });

    if (i.commandName === 'ticket') {
        const channel = await i.guild.channels.create({
            name: `tkt-${i.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [{ id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }]
        });
        await i.reply({ content: `✅ تم فتح التكت: ${channel}`, ephemeral: true });
    }

    if (i.commandName === 'clear') {
        const amount = i.options.getInteger('amount');
        await i.channel.bulkDelete(amount, true);
        await i.reply({ content: `🧹 تم حذف ${amount} رسالة`, ephemeral: true });
    }

    if (i.commandName === 'ban') {
        const target = i.options.getMember('target');
        await target.ban();
        await i.reply({ content: `🔨 تم حظر ${target.user.tag}`, ephemeral: true });
    }
});

// --- 3. نظام الفلتر + الأوامر النصية الطارئة ---
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    // الفلتر الجنائي
    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        return m.channel.send(`⚠️ تم حذف رسالة مخالفة من ${m.author.username}`).then(msg => setTimeout(() => msg.delete(), 3000));
    }

    // أمر إغلاق التكت النصي (للطوارئ)
    if (m.content === '!close' && m.channel.name.startsWith('tkt-')) {
        await m.channel.send("🔒 جاري إغلاق التذكرة...");
        setTimeout(() => m.channel.delete(), 2000);
    }
});

client.login(TOKEN);
