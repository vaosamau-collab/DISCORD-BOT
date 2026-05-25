// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const LOGS_CHANNEL_ID = "1508091945883275495"; 
let bannedWords = ["سب", "شتم", "ممنوع", "زق", "كلب", "حيوان", "زفت"];
const warnings = new Map(); 

const commands = [
  { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, description: 'عدد الرسائل', required: true }] },
  { name: 'قفل', description: 'قفل الشات' },
  { name: 'فتح', description: 'فتح الشات' },
  { name: 'حذر_سبه', description: 'إضافة كلمة محظورة', options: [{ name: 'كلمه', type: 3, description: 'الكلمة', required: true }] },
  { name: 'ازالت_سبه', description: 'إزالة كلمة محظورة', options: [{ name: 'كلمه', type: 3, description: 'الكلمة', required: true }] },
  { name: 'كلمات', description: 'عرض قائمة المحظورات' },
  { name: 'ركل', description: 'طرد عضو', options: [{ name: 'عضو', type: 6, description: 'العضو', required: true }, { name: 'سبب', type: 3, description: 'السبب' }] },
  { name: 'باند', description: 'حظر نهائي', options: [{ name: 'عضو', type: 6, description: 'العضو', required: true }, { name: 'سبب', type: 3, description: 'السبب' }] }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, async () => {
    try {
        await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
        console.log('✅ تم تحديث الأوامر بنجاح!');
    } catch (e) { console.error(e); }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = interaction.commandName;

    if (cmd === 'مسح') {
        await interaction.channel.bulkDelete(interaction.options.getInteger('عدد'), true);
        await interaction.reply({ content: '✅ تم المسح.', ephemeral: true });
    } else if (cmd === 'قفل') {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
        await interaction.reply('🔒 تم القفل.');
    } else if (cmd === 'فتح') {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });
        await interaction.reply('🔓 تم الفتح.');
    } else if (cmd === 'حذر_سبه') {
        bannedWords.push(interaction.options.getString('كلمه'));
        await interaction.reply('✅ تمت الإضافة.');
    } else if (cmd === 'ازالت_سبه') {
        bannedWords = bannedWords.filter(w => w !== interaction.options.getString('كلمه'));
        await interaction.reply('🗑️ تمت الإزالة.');
    } else if (cmd === 'كلمات') {
        await interaction.reply(`🚫 الكلمات: \`${bannedWords.join(', ')}\``);
    } else if (cmd === 'ركل') {
        const member = interaction.options.getMember('عضو');
        await member.kick(interaction.options.getString('سبب') || 'لا يوجد سبب');
        await interaction.reply(`👢 تم طرد ${member.user.tag}.`);
    } else if (cmd === 'باند') {
        const member = interaction.options.getMember('عضو');
        await member.ban({ reason: interaction.options.getString('سبب') || 'لا يوجد سبب' });
        await interaction.reply(`🔨 تم حظر ${member.user.tag} نهائياً.`);
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.member) return;

    let isBad = false;
    let reason = "رسالة مسيئة";

    const content = message.content.toLowerCase();
    if (bannedWords.some(word => content.includes(word))) {
        isBad = true;
    } else {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "هل الرسالة تحتوي على شتم أو سب؟ أجب بـ YES أو NO فقط." }, { role: "user", content: message.content }],
            });
            if (completion.choices[0].message.content.trim() === "YES") isBad = true;
        } catch (e) {}
    }

    if (isBad) {
        await message.delete().catch(() => {});
        const userId = message.author.id;
        const count = (warnings.get(userId) || 0) + 1;
        warnings.set(userId, count);

        let action = "";
        if (count === 1) { await message.member.timeout(5 * 60 * 1000, "سب"); action = "كتم 5 دقائق"; }
        else if (count === 2) { await message.member.timeout(60 * 60 * 1000, "سب"); action = "كتم 1 ساعة"; }
        else if (count === 3) { await message.member.timeout(5 * 60 * 60 * 1000, "سب"); action = "كتم 5 ساعات"; }
        else if (count === 4) { await message.member.timeout(7 * 60 * 60 * 1000, "سب"); action = "كتم 7 ساعات"; }
        else { await message.member.ban({ reason: "تجاوز التحذيرات" }); action = "باند نهائي"; warnings.delete(userId); }

        const msg = await message.channel.send(`${message.author}، **المخالفة ${count}**: ${action}.`);
        setTimeout(() => msg.delete().catch(), 5000);
        const logs = message.guild.channels.cache.get(LOGS_CHANNEL_ID);
        if (logs) logs.send(`⚠️ مخالفة: ${message.author.tag} | ${action}`);
    }
});

client.login(process.env.DISCORD_TOKEN);
