// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

// --- الإعدادات ---
let bannedWords = ["سب", "شتم", "ممنوع", "زق", "كلب", "لعنة"];
const LOGS_ID = "1508091945883275495";
const WELCOME_ID = "1508087523820310578";
const GENERAL_ID = "1507868881597759510";
const MY_ID = "1157314208988405760";

// --- أوامر الـ Slash الشاملة ---
const commands = [
    { name: 'ping', description: 'اختبار سرعة البوت' },
    { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, description: 'العدد (1-100)', required: true }] },
    { name: 'قفل', description: 'قفل الشات العام' },
    { name: 'فتح', description: 'فتح الشات العام' },
    { name: 'إضافة_كلمة', description: 'إضافة كلمة للمحظورات', options: [{ name: 'كلمة', type: 3, description: 'الكلمة', required: true }] },
    { name: 'حذف_كلمة', description: 'إزالة كلمة من المحظورات', options: [{ name: 'كلمة', type: 3, description: 'الكلمة', required: true }] },
    { name: 'عرض_الكلمات', description: 'عرض الكلمات المحظورة' }
];

client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`✅ البوت نشط بجميع الأوامر: ${client.user.tag}`);

    // نظام الإنعاش التلقائي
    setInterval(() => {
        const chan = client.channels.cache.get(GENERAL_ID);
        if (chan) chan.send("👋 السيرفر هادي، نبي تفاعل يا أبطال!");
    }, 3600000);
});

// --- معالجة الأوامر ---
client.on(Events.InteractionCreate, async (i) => {
    if (!i.isChatInputCommand()) return;
    if (i.user.id !== MY_ID) return i.reply({ content: "🚫 هذا الأمر خاص بالمطور أسامة.", ephemeral: true });

    const cmd = i.commandName;
    if (cmd === 'ping') await i.reply('🏓 Pong!');
    else if (cmd === 'مسح') {
        const count = i.options.getInteger('عدد');
        await i.channel.bulkDelete(count, true);
        await i.reply({ content: `✅ تم مسح ${count} رسالة.`, ephemeral: true });
    } else if (cmd === 'قفل') {
        await i.channel.permissionOverwrites.edit(i.guild.id, { SendMessages: false });
        await i.reply('🔒 تم قفل الشات.');
    } else if (cmd === 'فتح') {
        await i.channel.permissionOverwrites.edit(i.guild.id, { SendMessages: true });
        await i.reply('🔓 تم فتح الشات.');
    } else if (cmd === 'إضافة_كلمة') {
        bannedWords.push(i.options.getString('كلمة'));
        await i.reply(`✅ تمت إضافة الكلمة بنجاح.`);
    } else if (cmd === 'حذف_كلمة') {
        bannedWords = bannedWords.filter(w => w !== i.options.getString('كلمة'));
        await i.reply(`🗑️ تمت إزالة الكلمة بنجاح.`);
    } else if (cmd === 'عرض_الكلمات') {
        await i.reply(`🚫 الكلمات المحظورة: \`${bannedWords.join(', ')}\``);
    }
});

// --- الفلتر الشامل (بدون أوامر) ---
client.on(Events.MessageCreate, async (m) => {
    if (m.author.bot || !m.member || m.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    
    const cleanContent = m.content.toLowerCase().replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z]/g, '').replace(/\s+/g, '');
    const found = bannedWords.find(word => {
        const cleanBanned = word.toLowerCase().replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z]/g, '');
        return cleanContent.includes(cleanBanned);
    });

    if (found) {
        await m.delete().catch(() => {});
        m.author.send(`⚠️ تم حذف رسالتك بسبب كلمة ممنوعة: "${found}"`).catch(() => {});
        
        const logs = m.guild.channels.cache.get(LOGS_ID);
        if (logs) {
            const embed = new EmbedBuilder()
                .setTitle("🚨 رصد مخالفة (فلتر شامل)")
                .setColor(0xFF0000)
                .addFields(
                    { name: "العضو:", value: m.author.tag },
                    { name: "الكلمة:", value: `||${found}||` },
                    { name: "الوقت:", value: `<t:${Math.floor(Date.now() / 1000)}:R>` }
                );
            logs.send({ embeds: [embed] });
        }
    }
});

// --- ترحيب ---
client.on(Events.GuildMemberAdd, (m) => {
    client.channels.cache.get(WELCOME_ID)?.send(`أهلاً بك ${m} في سيرفر أسامة! نورتنا.`);
});

process.on('unhandledRejection', console.error);
client.login(process.env.DISCORD_TOKEN);
