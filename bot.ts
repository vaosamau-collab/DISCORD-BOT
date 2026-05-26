// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

// --- [1] الإعدادات ---
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

// --- [2] تسجيل الأوامر (كل شيء صار Slash) ---
client.once('ready', async (c) => {
    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('عرض قائمة الأوامر'),
        new SlashCommandBuilder().setName('kick').setDescription('طرد عضو').addUserOption(o => o.setName('target').setDescription('العضو').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('السبب')),
        new SlashCommandBuilder().setName('ban').setDescription('حظر عضو').addUserOption(o => o.setName('target').setDescription('العضو').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('السبب')),
        new SlashCommandBuilder().setName('report').setDescription('بلاغ').addUserOption(o => o.setName('target').setDescription('العضو').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('السبب')),
        new SlashCommandBuilder().setName('setlogs').setDescription('تحديد روم السبات').addChannelOption(o => o.setName('channel').setDescription('روم السجلات').setRequired(true)),
        new SlashCommandBuilder().setName('setwelcome').setDescription('تحديد روم الدخول/الخروج').addChannelOption(o => o.setName('channel').setDescription('روم الترحيب').setRequired(true))
    ];

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ النظام مفعل: ${c.user.tag}`);
});

// --- [3] ذاكرة النظام ---
const guildData = { logsId: "1508527170039976026", welcomeId: "1508527170039976026" };

// --- [4] معالجة التفاعلات ---
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;
    await i.deferReply({ ephemeral: true }).catch(() => {});

    try {
        if (i.commandName === 'setlogs') {
            guildData.logsId = i.options.getChannel('channel').id;
            await i.editReply(`✅ تم تعيين روم السجلات إلى: ${i.options.getChannel('channel')}`);
        } 
        else if (i.commandName === 'setwelcome') {
            guildData.welcomeId = i.options.getChannel('channel').id;
            await i.editReply(`✅ تم تعيين روم الترحيب إلى: ${i.options.getChannel('channel')}`);
        }
        else if (i.commandName === 'kick') {
            const member = i.options.getMember('target');
            await member.kick(i.options.getString('reason') || 'لا يوجد سبب');
            await i.editReply(`🔨 طردت ${member.user.tag}`);
        }
        // ... (يمكنك إضافة منطق الـ Ban و Report بنفس الطريقة)
    } catch (e) { await i.editReply("❌ حدث خطأ."); }
});

// --- [5] الفلتر الجنائي (يعمل بناءً على الروم المعين) ---
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;
    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        const ch = m.guild.channels.cache.get(guildData.logsId);
        ch?.send({ embeds: [new EmbedBuilder().setTitle("🚨 رصد مخالفة").setColor(0xFF0000).addFields(
            { name: "المخالف", value: `${m.author.tag}`, inline: true },
            { name: "الرسالة", value: `||${m.content}||` }
        )] });
    }
});

// --- [6] الترحيب الذكي ---
client.on('guildMemberAdd', (member) => {
    const ch = member.guild.channels.cache.get(guildData.welcomeId);
    ch?.send(`📥 انضم إلينا: ${member.user.tag}`);
});

client.on('guildMemberRemove', (member) => {
    const ch = member.guild.channels.cache.get(guildData.welcomeId);
    ch?.send(`📤 غادرنا: ${member.user.tag}`);
});

client.login(TOKEN);
