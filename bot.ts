// @ts-nocheck
const { 
    Client, GatewayIntentBits, Events, REST, Routes, 
    PermissionsBitField, EmbedBuilder, ActivityType 
} = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ] 
});

// --- قائمة الكلمات (محددة بعناية) ---
let bannedWords = ["زق", "كلب", "لعنة", "لعنه", "خنزير", "حمار", "حقير", "سافل", "خرا"];

// --- المعرفات ---
const LOGS_ID = "1508091945883275495";
const WELCOME_ID = "1508087523820310578";
const MY_ID = "1157314208988405760";

// --- هيكل الأوامر (Slash) ---
const commands = [
    { name: 'ping', description: 'فحص سرعة البوت' },
    { name: 'say', description: 'رسالة من البوت', options: [{ name: 'نص', type: 3, description: 'الرسالة المطلوبة', required: true }] },
    { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, description: 'عدد الرسائل', required: true }] },
    { name: 'قفل', description: 'إغلاق الشات العام' },
    { name: 'فتح', description: 'فتح الشات العام' },
    { 
        name: 'kick', description: 'طرد عضو', 
        options: [
            { name: 'عضو', type: 6, description: 'العضو المراد طرده', required: true },
            { name: 'السبب', type: 3, description: 'سبب الطرد', required: true }
        ] 
    },
    { 
        name: 'ban', description: 'حظر عضو', 
        options: [
            { name: 'عضو', type: 6, description: 'العضو المراد حظره', required: true },
            { name: 'السبب', type: 3, description: 'سبب الحظر', required: true }
        ] 
    },
    { name: 'إضافة_كلمة', description: 'إضافة كلمة للحظر', options: [{ name: 'كلمة', type: 3, description: 'الكلمة', required: true }] },
    { name: 'حذف_كلمة', description: 'حذف كلمة', options: [{ name: 'كلمة', type: 3, description: 'الكلمة', required: true }] },
    { name: 'عرض_الكلمات', description: 'عرض قائمة المحظورات' }
];

// --- تشغيل البوت ---
client.once(Events.ClientReady, async (c) => {
    console.log(`✅ النظام المطور يعمل الآن: ${c.user.tag}`);
    c.user.setActivity('نظام أسامة الأمني', { type: ActivityType.Watching });
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
});

// --- تنفيذ الأوامر ---
client.on(Events.InteractionCreate, async (i) => {
    if (!i.isChatInputCommand()) return;
    if (i.user.id !== MY_ID) return i.reply({ content: "🚫 غير مسموح لك باستخدام هذه الأوامر.", ephemeral: true });

    try {
        const cmd = i.commandName;

        if (cmd === 'ping') await i.reply(`🏓 سرعة البوت: ${client.ws.ping}ms`);
        else if (cmd === 'say') { await i.channel.send(i.options.getString('نص')); await i.reply({ content: "✅ تم الإرسال.", ephemeral: true }); }
        else if (cmd === 'مسح') { await i.channel.bulkDelete(i.options.getInteger('عدد'), true); await i.reply({ content: "✅ تم المسح.", ephemeral: true }); }
        else if (cmd === 'قفل') { await i.channel.permissionOverwrites.edit(i.guild.id, { SendMessages: false }); await i.reply('🔒 تم القفل.'); }
        else if (cmd === 'فتح') { await i.channel.permissionOverwrites.edit(i.guild.id, { SendMessages: true }); await i.reply('🔓 تم الفتح.'); }
        
        else if (cmd === 'kick') {
            const member = i.options.getMember('عضو');
            const reason = i.options.getString('السبب');
            await member.kick(reason);
            await i.reply(`🔨 تم طرد ${member.user.tag}، السبب: ${reason}`);
        }
        else if (cmd === 'ban') {
            const member = i.options.getMember('عضو');
            const reason = i.options.getString('السبب');
            await member.ban({ reason: reason });
            await i.reply(`🚫 تم حظر ${member.user.tag}، السبب: ${reason}`);
        }
        
        else if (cmd === 'إضافة_كلمة') { bannedWords.push(i.options.getString('كلمة')); await i.reply('✅ تمت الإضافة.'); }
        else if (cmd === 'حذف_كلمة') { bannedWords = bannedWords.filter(w => w !== i.options.getString('كلمة')); await i.reply('🗑️ تمت الإزالة.'); }
        else if (cmd === 'عرض_الكلمات') { await i.reply(`🚫 القائمة: \`${bannedWords.join(', ')}\``); }
        
    } catch (error) {
        console.error(error);
        await i.reply({ content: "⚠️ حدث خطأ أثناء تنفيذ الأمر.", ephemeral: true });
    }
});

// --- فلتر الرسائل (التدقيق) ---
client.on(Events.MessageCreate, async (m) => {
    if (m.author.bot || !m.member) return;
    
    // الفحص هنا يتم على الكلمات الموجودة فقط في مصفوفة bannedWords
    const content = m.content.toLowerCase();
    const found = bannedWords.find(word => content.includes(word.toLowerCase()));

    if (found) {
        await m.delete().catch(() => {});
        const logs = m.guild.channels.cache.get(LOGS_ID);
        if (logs) {
            logs.send({ embeds: [new EmbedBuilder().setTitle("🚨 مخالفة").setColor(0xFF0000).addFields(
                { name: "👤 العضو:", value: m.author.tag },
                { name: "🚫 الكلمة:", value: `||${found}||` },
                { name: "🕒 التوقيت:", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
            )] });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
