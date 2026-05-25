// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, ActivityType, EmbedBuilder } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const LOGS_CHANNEL_ID = "1508091945883275495"; 
const NOTIFY_CHANNEL_ID = "1508527170039976026";
const bannedWords = ["زق", "كلب", "حمار", "زفت", "حيوان", "سب"];
const warnings = new Map();

// --- الأوامر ---
const commands = [
  { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, required: true }] },
  { name: 'باند', description: 'حظر عضو', options: [{ name: 'عضو', type: 6, required: true }] },
  { name: 'ركل', description: 'طرد عضو', options: [{ name: 'عضو', type: 6, required: true }] },
  { name: 'سيرفر', description: 'معلومات السيرفر' }
];

client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
    client.user.setActivity('حماية سيرفر أسامة', { type: ActivityType.Watching });
    console.log('✅ البوت يعمل بكامل طاقته!');
});

// --- التنبيهات (دخول/خروج) ---
client.on(Events.GuildMemberAdd, member => {
    const channel = member.guild.channels.cache.get(NOTIFY_CHANNEL_ID);
    if (channel) channel.send(`👋 أهلاً بك يا ${member} في السيرفر!`);
});

client.on(Events.GuildMemberRemove, member => {
    const channel = member.guild.channels.cache.get(NOTIFY_CHANNEL_ID);
    if (channel) channel.send(`🚶 خرج العضو: ${member.user.tag}`);
});

// --- الأوامر ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'مسح') {
        await interaction.channel.bulkDelete(interaction.options.getInteger('عدد'), true);
        await interaction.reply({ content: '✅ تم.', ephemeral: true });
    } else if (interaction.commandName === 'باند') {
        await interaction.options.getMember('عضو').ban();
        await interaction.reply('🔨 تم الحظر.');
    } else if (interaction.commandName === 'ركل') {
        await interaction.options.getMember('عضو').kick();
        await interaction.reply('👢 تم الطرد.');
    } else if (interaction.commandName === 'سيرفر') {
        await interaction.reply(`السيرفر: ${interaction.guild.name}\nالأعضاء: ${interaction.guild.memberCount}`);
    }
});

// --- نظام الحماية والسجلات ---
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.member) return;

    const content = message.content.toLowerCase();
    let isBad = bannedWords.some(w => content.includes(w));
    
    if (!isBad) {
        try {
            const res = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "هل مسيئة؟ أجب YES أو NO" }, { role: "user", content: content }],
            });
            if (res.choices[0].message.content.trim() === "YES") isBad = true;
        } catch (e) {}
    }

    if (isBad) {
        await message.delete().catch(() => {});
        const count = (warnings.get(message.author.id) || 0) + 1;
        warnings.set(message.author.id, count);

        const duration = (count === 1) ? 5 : 60;
        const actionText = (count >= 5) ? "باند نهائي" : `كتم لمدة ${duration} دقيقة`;
        if (count >= 5) await message.member.ban();
        else await message.member.timeout(duration * 60 * 1000);

        // سجل احترافي في LOGS
        const logs = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (logs) {
            const embed = new EmbedBuilder()
                .setTitle("🔴 مخالفة جديدة")
                .setColor(0xFF0000)
                .addFields(
                    { name: "👤 العضو", value: `${message.author.tag}`, inline: true },
                    { name: "🕒 الوقت", value: new Date().toLocaleString('ar-SA'), inline: true },
                    { name: "🚫 الكلمة", value: `||${content}||` },
                    { name: "🔨 العقوبة", value: actionText }
                );
            logs.send({ embeds: [embed] });
        }

        const msg = await message.channel.send(`⚠️ ${message.author}، العقوبة: ${actionText}`);
        setTimeout(() => msg.delete().catch(), 5000);
    }
});

client.login(process.env.DISCORD_TOKEN);
