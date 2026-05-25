// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField } = require('discord.js');
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
const bannedWords = ["زق", "كلب", "حمار", "زفت", "حيوان", "سب"];
const warnings = new Map(); 

// --- الأوامر ---
const commands = [
  { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, description: 'عدد الرسائل', required: true }] },
  { name: 'باند', description: 'حظر عضو', options: [{ name: 'عضو', type: 6, description: 'العضو', required: true }] },
  { name: 'ركل', description: 'طرد عضو', options: [{ name: 'عضو', type: 6, description: 'العضو', required: true }] }
];

client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
    console.log('✅ البوت يعمل بكامل طاقته!');
});

// --- الأوامر الإدارية ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'مسح') {
        await interaction.channel.bulkDelete(interaction.options.getInteger('عدد'), true);
        await interaction.reply({ content: '✅ تم المسح.', ephemeral: true });
    } else if (interaction.commandName === 'باند') {
        const member = interaction.options.getMember('عضو');
        await member.ban();
        await interaction.reply(`🔨 تم باند ${member.user.tag}`);
    } else if (interaction.commandName === 'ركل') {
        const member = interaction.options.getMember('عضو');
        await member.kick();
        await interaction.reply(`👢 تم طرد ${member.user.tag}`);
    }
});

// --- الحماية (قائمة كلمات + ذكاء اصطناعي) ---
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.member) return;

    let isBad = false;
    const content = message.content.toLowerCase();

    // 1. فحص الكلمات المحظورة
    if (bannedWords.some(word => content.includes(word))) isBad = true;
    
    // 2. فحص الذكاء الاصطناعي (إذا لم تكن الكلمة في القائمة)
    if (!isBad) {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "هل الرسالة تحتوي على شتم أو إساءة؟ أجب بـ YES فقط إذا كانت مسيئة، و NO إذا كانت طبيعية." }, { role: "user", content: content }],
            });
            if (completion.choices[0].message.content.trim() === "YES") isBad = true;
        } catch (e) { console.error("AI Error:", e); }
    }

    // --- العقوبات ---
    if (isBad) {
        await message.delete().catch(() => {});
        const userId = message.author.id;
        const count = (warnings.get(userId) || 0) + 1;
        warnings.set(userId, count);

        let actionName = "";
        if (count === 1) { await message.member.timeout(5 * 60 * 1000, "سب"); actionName = "كتم 5 دقائق"; }
        else if (count === 2) { await message.member.timeout(60 * 60 * 1000, "سب"); actionName = "كتم 1 ساعة"; }
        else if (count === 3) { await message.member.timeout(5 * 60 * 60 * 1000, "سب"); actionName = "كتم 5 ساعات"; }
        else if (count === 4) { await message.member.timeout(7 * 60 * 60 * 1000, "سب"); actionName = "كتم 7 ساعات"; }
        else { await message.member.ban({ reason: "تكرار الإساءة" }); actionName = "باند نهائي"; warnings.delete(userId); }

        const msg = await message.channel.send(`⚠️ ${message.author}، **مخالفة (${count}/5)**: ${actionName}.`);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
        
        const logs = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (logs) logs.send(`🔴 مخالفة: ${message.author.tag} | ${actionName}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
