// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, ActivityType } from 'discord.js';

const client = new Client({ intents: [131071] });
const { DISCORD_TOKEN: TOKEN, CLIENT_ID = "1507868881597759510" } = process.env;

// --- نظام البناء الفخم ---
const createEmbed = (title, desc, color = 0x2b2d31) => new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color).setTimestamp();

client.once('ready', async () => {
    const commands = [
        new SlashCommandBuilder().setName('setup').setDescription('إعداد النظام بالكامل'),
        new SlashCommandBuilder().setName('ping').setDescription('فحص الاستجابة')
    ];
    await new REST({ version: '10' }).setToken(TOKEN).put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    client.user.setActivity('نظام أسامة العملاق | 🛡️', { type: ActivityType.Watching });
    console.log(`🚀 المحرك الضخم يعمل: ${client.user.tag}`);
});

// --- التفاعل (أزرار التكت + أوامر السلاش) ---
client.on('interactionCreate', async (i) => {
    if (i.isChatInputCommand() && i.commandName === 'setup') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('tkt').setLabel('فتح تذكرة دعم 📩').setStyle(ButtonStyle.Primary)
        );
        await i.reply({ content: "### 🎫 مركز الدعم الفني\nاضغط الزر أدناه لفتح تذكرة جديدة:", components: [row] });
    }
    if (i.isButton() && i.customId === 'tkt') {
        const t = await i.guild.channels.create({
            name: `tkt-${i.user.username}`, type: ChannelType.GuildText,
            permissionOverwrites: [{ id: i.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, { id: i.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }]
        });
        await i.reply({ content: `✅ تم إنشاء ${t}`, ephemeral: true });
        t.send({ embeds: [createEmbed("تذكرة جديدة", `مرحباً ${i.user}، فريق الدعم سيتواصل معك قريباً.`)] });
    }
});

// --- النظام النصي العملاق (فلتر + إدارة) ---
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    // 1. نظام الفلتر الذكي
    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        return m.channel.send({ embeds: [createEmbed("⚠️ تحذير", `${m.author}، الكلمات المخالفة ممنوعة!`, 0xff0000)] }).then(msg => setTimeout(() => msg.delete(), 3000));
    }

    // 2. أوامر الإدارة المتطورة
    if (!m.content.startsWith('!')) return;
    const args = m.content.slice(1).split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === 'close' && m.channel.name.startsWith('tkt-')) {
        m.channel.send("🔒 إغلاق التذكرة بعد 5 ثواني..");
        setTimeout(() => m.channel.delete(), 5000);
    }
    if (cmd === 'clear') {
        const n = parseInt(args[0]) || 1;
        await m.channel.bulkDelete(n, true).then(() => m.channel.send("🧹 تم تنظيف الشات."));
    }
});

client.login(TOKEN);
