// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, ActivityType, EmbedBuilder } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const LOGS_CHANNEL_ID = "1508091945883275495"; 
const NOTIFY_CHANNEL_ID = "1508527170039976026";
const bannedWords = ["زق", "كلب", "حمار", "زفت", "حيوان", "سب"];
const warnings = new Map();

// --- تعريف الأوامر مع الوصف الإجباري لكل خيار ---
const commands = [
  { 
    name: 'مسح', 
    description: 'مسح عدد معين من الرسائل', 
    options: [{ name: 'عدد', type: 4, description: 'أدخل عدد الرسائل للمسح', required: true }] 
  },
  { 
    name: 'باند', 
    description: 'حظر عضو من السيرفر', 
    options: [{ name: 'عضو', type: 6, description: 'حدد العضو الذي تريد حظره', required: true }] 
  },
  { 
    name: 'ركل', 
    description: 'طرد عضو من السيرفر', 
    options: [{ name: 'عضو', type: 6, description: 'حدد العضو الذي تريد طرده', required: true }] 
  },
  { 
    name: 'سيرفر', 
    description: 'عرض معلومات السيرفر الحالية' 
  }
];

// --- تشغيل البوت ---
client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
        client.user.setActivity('حماية سيرفر أسامة', { type: ActivityType.Watching });
        console.log('✅ البوت يعمل بنجاح - تم تسجيل كافة الأوامر!');
    } catch (error) {
        console.error('خطأ في تسجيل الأوامر:', error);
    }
});

// --- نظام الترحيب والمغادرة ---
client.on(Events.GuildMemberAdd, member => {
    const channel = member.guild.channels.cache.get(NOTIFY_CHANNEL_ID);
    if (channel) {
        channel.send(`👋 أهلاً بك يا ${member} في السيرفر! نورتنا.`);
    }
});

client.on(Events.GuildMemberRemove, member => {
    const channel = member.guild.channels.cache.get(NOTIFY_CHANNEL_ID);
    if (channel) {
        channel.send(`🚶 خرج العضو: **${member.user.tag}** من السيرفر.`);
    }
});

// --- معالجة الأوامر التفاعلية ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'مسح') {
        const amount = interaction.options.getInteger('عدد');
        await interaction.channel.bulkDelete(amount, true);
        await interaction.reply({ content: `✅ تم حذف ${amount} رسالة بنجاح.`, ephemeral: true });
    } 
    else if (interaction.commandName === 'باند') {
        const member = interaction.options.getMember('عضو');
        await member.ban();
        await interaction.reply(`🔨 تم حظر العضو: ${member.user.tag}`);
    } 
    else if (interaction.commandName === 'ركل') {
        const member = interaction.options.getMember('عضو');
        await member.kick();
        await interaction.reply(`👢 تم طرد العضو: ${member.user.tag}`);
    } 
    else if (interaction.commandName === 'سيرفر') {
        await interaction.reply(`📊 معلومات السيرفر:\nاسم السيرفر: ${interaction.guild.name}\nعدد الأعضاء: ${interaction.guild.memberCount}`);
    }
});

// --- نظام الحماية الذكي وسجل المخالفات ---
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.member) return;

    const content = message.content.toLowerCase();
    let isBad = bannedWords.some(w => content.includes(w));
    
    if (!isBad) {
        try {
            const res = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "هل الرسالة مسيئة؟ أجب فقط بـ YES أو NO." }, { role: "user", content: content }],
            });
            if (res.choices[0].message.content.trim() === "YES") isBad = true;
        } catch (e) {
            console.error("خطأ في الاتصال بالذكاء الاصطناعي:", e);
        }
    }

    if (isBad) {
        await message.delete().catch(() => {});
        const count = (warnings.get(message.author.id) || 0) + 1;
        warnings.set(message.author.id, count);

        const duration = (count === 1) ? 5 : 60;
        const actionText = (count >= 5) ? "باند نهائي" : `كتم لمدة ${duration} دقيقة`;
        
        if (count >= 5) await message.member.ban({ reason: "تكرار الإساءة" });
        else await message.member.timeout(duration * 60 * 1000, "إساءة استخدام اللغة");

        // تسجيل المخالفة في الروم المخصص
        const logs = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (logs) {
            const embed = new EmbedBuilder()
                .setTitle("🔴 مخالفة جديدة - نظام الحماية")
                .setColor(0xFF0000)
                .addFields(
                    { name: "👤 العضو", value: `${message.author.tag}`, inline: true },
                    { name: "🕒 التوقيت", value: new Date().toLocaleString('ar-SA'), inline: true },
                    { name: "🚫 الكلمة المسيئة", value: `||${content}||`, inline: false },
                    { name: "🔨 العقوبة", value: actionText, inline: true }
                )
                .setTimestamp();
            logs.send({ embeds: [embed] });
        }

        const msg = await message.channel.send(`⚠️ ${message.author}، تم حذف رسالتك. العقوبة: ${actionText}`);
        setTimeout(() => msg.delete().catch(() => {}), 7000);
    }
});

client.login(process.env.DISCORD_TOKEN);
