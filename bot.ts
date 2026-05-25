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

const commands = [
  { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, required: true }] },
  { name: 'باند', description: 'حظر عضو', options: [{ name: 'عضو', type: 6, required: true }] },
  { name: 'ركل', description: 'طرد عضو', options: [{ name: 'عضو', type: 6, required: true }] },
  { name: 'رابط', description: 'الحصول على دعوة السيرفر' },
  { name: 'سيرفر', description: 'معلومات السيرفر' },
  { name: 'تذكير', description: 'ضبط تذكير سريع', options: [{ name: 'الوقت', type: 4, description: 'بالدقائق', required: true }, { name: 'المهمة', type: 3, required: true }] }
];

client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
    client.user.setActivity('حماية السيرفر | /تذكير', { type: ActivityType.Watching });
    console.log('✅ تم التفعيل بنجاح!');
});

client.on(Events.GuildMemberAdd, member => {
    const channel = member.guild.channels.cache.get(NOTIFY_CHANNEL_ID);
    if (channel) channel.send(`👋 أهلاً بك يا ${member} في السيرفر!`);
});

client.on(Events.GuildMemberRemove, member => {
    const channel = member.guild.channels.cache.get(NOTIFY_CHANNEL_ID);
    if (channel) channel.send(`🚶 خرج العضو: ${member.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'مسح') {
        await interaction.channel.bulkDelete(interaction.options.getInteger('عدد'), true);
        await interaction.reply({ content: '✅ تم مسح الرسائل.', ephemeral: true });
    } else if (interaction.commandName === 'باند') {
        await interaction.options.getMember('عضو').ban();
        await interaction.reply('🔨 تم الحظر.');
    } else if (interaction.commandName === 'ركل') {
        await interaction.options.getMember('عضو').kick();
        await interaction.reply('👢 تم الطرد.');
    } else if (interaction.commandName === 'رابط') {
        const invite = await interaction.channel.createInvite({ maxAge: 0, maxUses: 0 });
        await interaction.reply(`🔗 رابط السيرفر: ${invite.url}`);
    } else if (interaction.commandName === 'سيرفر') {
        await interaction.reply(`اسم السيرفر: ${interaction.guild.name}\nعدد الأعضاء: ${interaction.guild.memberCount}`);
    } else if (interaction.commandName === 'تذكير') {
        const time = interaction.options.getInteger('الوقت');
        const task = interaction.options.getString('المهمة');
        await interaction.reply(`⏰ تم ضبط التذكير بعد ${time} دقيقة: "${task}"`);
        setTimeout(async () => {
            await interaction.user.send(`🔔 تذكير: ${task}`);
        }, time * 60 * 1000);
    }
});

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
        
        if (count >= 5) await message.member.ban();
        else await message.member.timeout(60 * 60 * 1000);

        const msg = await message.channel.send(`⚠️ ${message.author}، تحذير (${count}/5).`);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
        
        const logs = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (logs) logs.send(`🔴 مخالفة: ${message.author.tag} | العقوبة: ${count >= 5 ? 'باند' : 'كتم'}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
