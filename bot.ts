// @ts-nocheck
const { Client, GatewayIntentBits, Events, REST, Routes, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

let bannedWords = ["سب", "شتم", "ممنوع", "زق", "كلب", "لعنة", "لعنه"];
const LOGS_ID = "1508091945883275495";
const WELCOME_ID = "1508087523820310578";
const GENERAL_ID = "1507868881597759510";
const MY_ID = "1157314208988405760";

// --- قائمة الأوامر المحدثة مع أمر say ---
const commands = [
    { name: 'ping', description: 'اختبار سرعة البوت' },
    { name: 'مسح', description: 'مسح رسائل', options: [{ name: 'عدد', type: 4, description: 'العدد (1-100)', required: true }] },
    { name: 'say', description: 'اجعل البوت يكتب رسالة', options: [{ name: 'نص', type: 3, description: 'الرسالة التي تريدها', required: true }] },
    { name: 'قفل', description: 'قفل الشات' },
    { name: 'فتح', description: 'فتح الشات' },
    { name: 'إضافة_كلمة', description: 'إضافة كلمة للحظر', options: [{ name: 'كلمة', type: 3, description: 'الكلمة', required: true }] },
    { name: 'حذف_كلمة', description: 'حذف كلمة من الحظر', options: [{ name: 'كلمة', type: 3, description: 'الكلمة', required: true }] },
    { name: 'عرض_الكلمات', description: 'عرض الكلمات المحظورة' }
];

client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`✅ النظام مفعل بالكامل.`);
});

// --- معالجة الأوامر ---
client.on(Events.InteractionCreate, async (i) => {
    if (!i.isChatInputCommand()) return;
    if (i.user.id !== MY_ID) return i.reply({ content: "🚫 هذا الأمر خاص بأسامة.", ephemeral: true });

    switch (i.commandName) {
        case 'ping': await i.reply('🏓 Pong!'); break;
        case 'say': await i.channel.send(i.options.getString('نص')); await i.reply({ content: "✅ تم الإرسال.", ephemeral: true }); break;
        case 'مسح':
            const count = i.options.getInteger('عدد');
            await i.channel.bulkDelete(count, true);
            await i.reply({ content: `✅ تم مسح ${count} رسالة.`, ephemeral: true });
            break;
        case 'قفل':
            await i.channel.permissionOverwrites.edit(i.guild.id, { SendMessages: false });
            await i.reply('🔒 تم القفل.');
            break;
        case 'فتح':
            await i.channel.permissionOverwrites.edit(i.guild.id, { SendMessages: true });
            await i.reply('🔓 تم الفتح.');
            break;
        case 'إضافة_كلمة':
            bannedWords.push(i.options.getString('كلمة'));
            await i.reply(`✅ تمت إضافة: ${i.options.getString('كلمة')}`);
            break;
        case 'حذف_كلمة':
            bannedWords = bannedWords.filter(w => w !== i.options.getString('كلمة'));
            await i.reply(`🗑️ تمت إزالة: ${i.options.getString('كلمة')}`);
            break;
        case 'عرض_الكلمات':
            await i.reply(`🚫 الكلمات: \`${bannedWords.join(', ')}\``);
            break;
    }
});

// --- الفلتر الشامل (يفحص الجميع بما فيهم أنت) ---
client.on(Events.MessageCreate, async (m) => {
    if (m.author.bot || !m.member) return;
    
    // التحقق من النص (بدون تجاهل الأدمين لتتأكد بنفسك من عمل البوت)
    const cleanContent = m.content.toLowerCase().replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z]/g, '').replace(/\s+/g, '');
    const found = bannedWords.find(word => {
        const cleanBanned = word.toLowerCase().replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z]/g, '');
        return cleanContent.includes(cleanBanned);
    });

    if (found) {
        await m.delete().catch(() => {});
        const logs = m.guild.channels.cache.get(LOGS_ID);
        if (logs) {
            logs.send({ embeds: [new EmbedBuilder().setTitle("🚨 مخالفة").setDescription(`العضو: ${m.author.tag}\nالكلمة: ||${found}||`).setColor(0xFF0000)] });
        }
    }
});

client.on(Events.GuildMemberAdd, (m) => {
    client.channels.cache.get(WELCOME_ID)?.send(`يا هلا ${m} نورت سيرفر أسامة!`);
});

client.login(process.env.DISCORD_TOKEN);
