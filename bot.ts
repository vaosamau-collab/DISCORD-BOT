// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField, EmbedBuilder, ActivityType } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers 
    ] 
});

// --- البيانات والإعدادات ---
let bannedWords = ["سب", "شتم", "ممنوع", "زق", "كلب", "لعنة", "لعنه"];
const LOGS_ID = "1508091945883275495";
const WELCOME_ID = "1508087523820310578";
const GENERAL_ID = "1507868881597759510";
const MY_ID = "1157314208988405760";

// --- أوامر Slash المتقدمة ---
const commands = [
    { name: 'ping', description: 'اختبار سرعة استجابة البوت' },
    { name: 'say', description: 'يجعل البوت يكتب نصاً في الشات', options: [{ name: 'نص', type: 3, description: 'الرسالة', required: true }] },
    { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, description: '1-100', required: true }] },
    { name: 'قفل', description: 'قفل الشات العام' },
    { name: 'فتح', description: 'فتح الشات العام' },
    { name: 'إضافة_كلمة', description: 'إضافة كلمة للحظر', options: [{ name: 'كلمة', type: 3, description: 'الكلمة', required: true }] },
    { name: 'حذف_كلمة', description: 'إزالة كلمة من الحظر', options: [{ name: 'كلمة', type: 3, description: 'الكلمة', required: true }] },
    { name: 'عرض_الكلمات', description: 'عرض الكلمات المحظورة' },
    { name: 'معلومات', description: 'عرض معلومات البوت' }
];

// --- تشغيل النظام ---
client.once(Events.ClientReady, async (c) => {
    console.log(`✅ البوت متصل بنجاح: ${c.user.tag}`);
    c.user.setActivity('نظام أسامة الأمني', { type: ActivityType.Watching });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(c.user.id), { body: commands });
});

// --- إدارة الأوامر ---
client.on(Events.InteractionCreate, async (i) => {
    if (!i.isChatInputCommand()) return;
    if (i.user.id !== MY_ID) return i.reply({ content: "🚫 أنت لست المطور (أسامة).", ephemeral: true });

    try {
        if (i.commandName === 'ping') await i.reply(`🏓 سرعة الاستجابة: ${client.ws.ping}ms`);
        else if (i.commandName === 'say') { await i.channel.send(i.options.getString('نص')); await i.reply({ content: "✅ تم.", ephemeral: true }); }
        else if (i.commandName === 'مسح') {
            const count = i.options.getInteger('عدد');
            await i.channel.bulkDelete(count, true);
            await i.reply({ content: `✅ تم مسح ${count} رسالة.`, ephemeral: true });
        }
        else if (i.commandName === 'قفل') { await i.channel.permissionOverwrites.edit(i.guild.id, { SendMessages: false }); await i.reply('🔒 تم القفل.'); }
        else if (i.commandName === 'فتح') { await i.channel.permissionOverwrites.edit(i.guild.id, { SendMessages: true }); await i.reply('🔓 تم الفتح.'); }
        else if (i.commandName === 'إضافة_كلمة') { bannedWords.push(i.options.getString('كلمة')); await i.reply('✅ تمت الإضافة.'); }
        else if (i.commandName === 'حذف_كلمة') { bannedWords = bannedWords.filter(w => w !== i.options.getString('كلمة')); await i.reply('🗑️ تمت الإزالة.'); }
        else if (i.commandName === 'عرض_الكلمات') { await i.reply(`🚫 الكلمات: \`${bannedWords.join(', ')}\``); }
        else if (i.commandName === 'معلومات') { await i.reply('🤖 هذا البوت مخصص لحماية سيرفر أسامة.'); }
    } catch (error) { console.error("خطأ في أمر:", error); }
});

// --- الفلتر الشامل (مع معالجة الأخطاء) ---
client.on(Events.MessageCreate, async (m) => {
    if (m.author.bot || !m.member) return;

    // تنظيف النص من أي زخرفة أو مسافات
    const cleanContent = m.content.toLowerCase().replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z]/g, '').replace(/\s+/g, '');
    const found = bannedWords.find(word => cleanContent.includes(word.toLowerCase().replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z]/g, '')));

    if (found) {
        await m.delete().catch(() => {});
        
        // تنبيه خاص (يتم التعامل مع الخطأ إذا كان الخاص مغلقاً)
        m.author.send(`⚠️ تم حذف رسالتك بسبب محتوى مخالف: "${found}"`).catch(() => {});

        // السجل المتقدم
        const logs = m.guild.channels.cache.get(LOGS_ID);
        if (logs) {
            logs.send({ embeds: [new EmbedBuilder()
                .setTitle("🚨 رصد مخالفة")
                .setColor(0xFF0000)
                .addFields(
                    { name: "👤 العضو:", value: `${m.author.tag} (ID: ${m.author.id})` },
                    { name: "🚫 الكلمة:", value: `||${found}||` },
                    { name: "🕒 التوقيت:", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
                )
                .setFooter({ text: "نظام أسامة الأمني - متطور" })
            ] });
        }
    }
});

// --- ترحيب ومراقبة ---
client.on(Events.GuildMemberAdd, (m) => {
    client.channels.cache.get(WELCOME_ID)?.send(`يا هلا ${m}، نورت سيرفر أسامة!`);
});

// مراقبة أعطال البوت
process.on('uncaughtException', (err) => console.error('خطأ جسيم:', err));
process.on('unhandledRejection', (reason) => console.error('خطأ غير معالج:', reason));

client.login(process.env.DISCORD_TOKEN);
