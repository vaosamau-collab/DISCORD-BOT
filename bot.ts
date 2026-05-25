// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const LOGS_CHANNEL_ID = "1508091945883275495"; 
let bannedWords = ["زق", "كلب", "حمار", "زفت", "حيوان", "سب"];
const warnings = new Map(); 

// --- كل الأوامر هنا ---
const commands = [
  { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, description: 'عدد الرسائل', required: true }] },
  { name: 'قفل', description: 'قفل الشات' },
  { name: 'فتح', description: 'فتح الشات' },
  { name: 'حذر_سبه', description: 'إضافة كلمة محظورة', options: [{ name: 'كلمه', type: 3, description: 'الكلمة', required: true }] },
  { name: 'ازالت_سبه', description: 'إزالة كلمة محظورة', options: [{ name: 'كلمه', type: 3, description: 'الكلمة', required: true }] },
  { name: 'كلمات', description: 'عرض قائمة المحظورات' },
  { name: 'ركل', description: 'طرد عضو', options: [{ name: 'عضو', type: 6, description: 'العضو', required: true }] },
  { name: 'باند', description: 'حظر عضو', options: [{ name: 'عضو', type: 6, description: 'العضو', required: true }] }
];

client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands("1507873930554245200"), { body: commands });
    console.log('✅ تم تفعيل كافة الأوامر!');
});

// --- تنفيذ الأوامر ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    if (interaction.commandName === 'مسح') {
        await interaction.channel.bulkDelete(interaction.options.getInteger('عدد'), true);
        await interaction.reply({ content: '✅ تم المسح.', ephemeral: true });
    } else if (interaction.commandName === 'قفل') {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
        await interaction.reply('🔒 تم القفل.');
    } else if (interaction.commandName === 'فتح') {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });
        await interaction.reply('🔓 تم الفتح.');
    } else if (interaction.commandName === 'حذر_سبه') {
        bannedWords.push(interaction.options.getString('كلمه'));
        await interaction.reply('✅ تمت الإضافة.');
    } else if (interaction.commandName === 'ازالت_سبه') {
        bannedWords = bannedWords.filter(w => w !== interaction.options.getString('كلمه'));
        await interaction.reply('🗑️ تمت الإزالة.');
    } else if (interaction.commandName === 'كلمات') {
        await interaction.reply(`🚫 الكلمات: \`${bannedWords.join(', ')}\``);
    } else if (interaction.commandName === 'ركل') {
        const member = interaction.options.getMember('عضو');
        await member.kick();
        await interaction.reply(`👢 تم طرد ${member.user.tag}`);
    } else if (interaction.commandName === 'باند') {
        const member = interaction.options.getMember('عضو');
        await member.ban();
        await interaction.reply(`🔨 تم باند ${member.user.tag}`);
    }
});

// --- نظام الحماية (الحالي) ---
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.member) return;
    const content = message.content.toLowerCase();
    
    // فحص سريع (كلمات) + فحص ذكاء اصطناعي
    let isBad = bannedWords.some(w => content.includes(w));
    if (!isBad) {
        try {
            const res = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "هل الرسالة مسيئة؟ أجب YES أو NO" }, { role: "user", content: content }],
            });
            if (res.choices[0].message.content.trim() === "YES") isBad = true;
        } catch (e) {}
    }

    if (isBad) {
        await message.delete().catch(() => {});
        const userId = message.author.id;
        const count = (warnings.get(userId) || 0) + 1;
        warnings.set(userId, count);
        
        let action = "";
        if (count === 1) { await message.member.timeout(5 * 60 * 1000); action = "كتم 5 دقائق"; }
        else if (count === 2) { await message.member.timeout(60 * 60 * 1000); action = "كتم 1 ساعة"; }
        else if (count === 3) { await message.member.timeout(5 * 60 * 60 * 1000); action = "كتم 5 ساعات"; }
        else if (count === 4) { await message.member.timeout(7 * 60 * 60 * 1000); action = "كتم 7 ساعات"; }
        else { await message.member.ban(); action = "باند نهائي"; warnings.delete(userId); }

        const msg = await message.channel.send(`⚠️ ${message.author}، **(${count}/5)**: ${action}.`);
        setTimeout(() => msg.delete().catch(() => {}), 5000);
    }
});

client.login(process.env.DISCORD_TOKEN);
