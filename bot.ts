// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField, EmbedBuilder } = require('discord.js');
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
let bannedWords = ["زق", "كلب", "حمار", "زفت", "حيوان", "سب"];
const warnings = new Map(); 

// --- تعريف الأوامر (الإدارية + المعلومات + الترفيه) ---
const commands = [
  { name: 'مسح', description: 'مسح عدد من الرسائل', options: [{ name: 'عدد', type: 4, description: 'العدد', required: true }] },
  { name: 'قفل', description: 'قفل الشات' },
  { name: 'فتح', description: 'فتح الشات' },
  { name: 'حذر_سبه', description: 'إضافة كلمة محظورة', options: [{ name: 'كلمه', type: 3, description: 'الكلمة', required: true }] },
  { name: 'ازالت_سبه', description: 'إزالة كلمة محظورة', options: [{ name: 'كلمه', type: 3, description: 'الكلمة', required: true }] },
  { name: 'كلمات', description: 'عرض قائمة المحظورات' },
  { name: 'ركل', description: 'طرد عضو', options: [{ name: 'عضو', type: 6, required: true }] },
  { name: 'باند', description: 'حظر عضو', options: [{ name: 'عضو', type: 6, required: true }] },
  { name: 'كتم', description: 'كتم عضو يدوياً', options: [{ name: 'عضو', type: 6, required: true }] },
  { name: 'أفاتار', description: 'عرض صورة العضو', options: [{ name: 'عضو', type: 6, required: true }] },
  { name: 'معلومات_سيرفر', description: 'عرض معلومات السيرفر' },
  { name: 'قرعة', description: 'عمل تصويت', options: [{ name: 'سؤال', type: 3, required: true }] }
];

client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
    console.log('✅ البوت يعمل بكامل طاقته وأوامره!');
});

// --- معالجة الأوامر ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const cmd = interaction.commandName;
    const member = interaction.options.getMember('عضو');

    try {
        if (cmd === 'مسح') {
            await interaction.channel.bulkDelete(interaction.options.getInteger('عدد'), true);
            await interaction.reply({ content: '✅ تم المسح.', ephemeral: true });
        } else if (cmd === 'قفل') {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
            await interaction.reply('🔒 تم قفل الشات.');
        } else if (cmd === 'فتح') {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });
            await interaction.reply('🔓 تم فتح الشات.');
        } else if (cmd === 'حذر_سبه') {
            bannedWords.push(interaction.options.getString('كلمه'));
            await interaction.reply('✅ تم إضافة الكلمة.');
        } else if (cmd === 'ازالت_سبه') {
            bannedWords = bannedWords.filter(w => w !== interaction.options.getString('كلمه'));
            await interaction.reply('🗑️ تم إزالة الكلمة.');
        } else if (cmd === 'كلمات') {
            await interaction.reply(`🚫 الكلمات المحظورة: \`${bannedWords.join(', ')}\``);
        } else if (cmd === 'ركل') {
            await member.kick();
            await interaction.reply(`👢 تم طرد ${member.user.tag}.`);
        } else if (cmd === 'باند') {
            await member.ban();
            await interaction.reply(`🔨 تم باند ${member.user.tag}.`);
        } else if (cmd === 'كتم') {
            await member.timeout(60 * 60 * 1000, "كتم يدوي");
            await interaction.reply(`🔇 تم كتم ${member.user.tag} لمدة ساعة.`);
        } else if (cmd === 'أفاتار') {
            await interaction.reply(member.user.displayAvatarURL({ dynamic: true, size: 1024 }));
        } else if (cmd === 'معلومات_سيرفر') {
            await interaction.reply(`اسم السيرفر: ${interaction.guild.name}\nعدد الأعضاء: ${interaction.guild.memberCount}`);
        } else if (cmd === 'قرعة') {
            const msg = await interaction.reply({ content: `📊 تصويت: ${interaction.options.getString('سؤال')}`, fetchReply: true });
            await msg.react('✅'); await msg.react('❌');
        }
    } catch (e) {
        console.error(e);
        await interaction.reply({ content: 'حدث خطأ، تأكد من صلاحيات البوت!', ephemeral: true });
    }
});

// --- نظام الحماية (AI + كلمات) ---
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.member) return;

    const content = message.content.toLowerCase();
    let isBad = bannedWords.some(w => content.includes(w));

    if (!isBad) {
        try {
            const res = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "هل الرسالة مسيئة؟ أجب YES أو NO فقط." }, { role: "user", content: content }],
            });
            if (res.choices[0].message.content.trim() === "YES") isBad = true;
        } catch (e) {}
    }

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

        const warningMsg = await message.channel.send(`⚠️ ${message.author}، **المخالفة ${count}**: ${actionName}.`);
        setTimeout(() => warningMsg.delete().catch(() => {}), 5000);
        
        const logs = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (logs) logs.send(`🔴 مخالفة: ${message.author.tag} | العقوبة: ${actionName}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
