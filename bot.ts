// @ts-nocheck
/**
 * 🛡️ نظام إدارة وحماية سيرفر أسامة المتكامل
 * المطور الرئيسي: أسامة (Na5p)
 * لغة البرمجة: TypeScript / Discord.js v14
 * بيئة التشغيل: Railway Cloud
 */

import { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    ActivityType,
    PermissionFlagsBits,
    ChannelType
} from 'discord.js';
import * as broadcastCommand from './broadcast.js'; // استدعاء نظام البرودكاست الذكي من الملف الثاني

// --- 1. إعداد وتكوين العميل بأعلى ميزات الوصول وصلاحيات الكاش ---
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ] 
});

// سحب المتغيرات البيئية الحساسة من إعدادات ريلواي الآمنة
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";
const PREFIX = "!"; // بريفكس الأوامر الإدارية العادية في الشات

// قائمة الكلمات الممنوعة لنظام الفلتر الآلي والمراقبة
const BLACKLISTED_WORDS: string[] = ["زق", "كلب", "خرا"];

// --- 2. حدث Ready الحصري (يشتغل أول ما البوت يربط بالنت بنجاح) ---
client.once('ready', async () => {
    console.log('====================================================');
    console.log(`🤖 تم تشغيل نظام البوت بنجاح بواسطة أسامة!`);
    console.log(`📡 اسم البوت الحالي في ديسكورد: ${client.user.tag}`);
    console.log(`🆔 معرف البوت الفريد (ID): ${client.user.id}`);
    console.log('====================================================');

    // إعداد الحالة النشطة للبوت بشكل فخم ومتحرك
    try {
        client.user.setPresence({
            activities: [{ 
                name: '🛡️ إدارة سيرفر أسامة | !help', 
                type: ActivityType.Custom 
            }],
            status: 'online',
        });
        console.log('🔹 [الحالة] تم تعيين حالة البوت والنشاط بنجاح.');
    } catch (presenceError) {
        console.error('❌ [خطأ في الحالة] فشل تعيين النشاط:', presenceError);
    }

    // جاري بدء تحديث وتسجيل أوامر السلاش المخصصة هناك في الخلفية
    try {
        console.log('🔄 [السلاش] جاري بناء وتهيئة قائمة الأوامر التلقائية المحدودة...');
        
        const slashCommands = [
            // 1. أمر الفحص السريع والبسيط
            new SlashCommandBuilder()
                .setName('ping')
                .setDescription('فحص جودة وسرعة استجابة اتصال البوت بالخوادم الرئيسية'),
                
            // 2. أمر البرودكاست المربوط بالملف الثاني الذكي
            broadcastCommand.data.toJSON()
        ].map(cmd => cmd.toJSON());

        const rest = new REST({ version: '10' }).setToken(TOKEN);
        
        console.log('📤 [السلاش] جاري إرسال البيانات وتحديث القائمة في خوادم ديسكورد العامة...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: slashCommands });
        
        console.log('✅ [السلاش] اكتملت العملية! أوامر السلاش (ping و broadcast) نشطة الحين.');
    } catch (slashRegisterError) {
        console.error('⚠️ [تحذير السلاش] حدثت مشكلة أثناء الرفع التلقائي، تم تجاوزها لمنع الكراش:', slashRegisterError);
    }
    
    console.log('🚀 البوت جاهز ومستقر تماماً في Railway لاستقبال الضغطات والرسائل!');
    console.log('====================================================');
});

// --- 3. نظام استقبال ومعالجة أوامر السلاش (Interaction Create) ---
client.on('interactionCreate', async (interaction) => {
    // نتأكد أولاً أن التفاعل عبارة عن أمر نصي وليس زر أو قائمة اختيار
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    console.log(`📥 [تفاوض سلاش] تم استخدام أمر: /${commandName} بواسطة: ${interaction.user.tag}`);

    // [معالجة أمر ping]
    if (commandName === 'ping') {
        try {
            const apiPing = client.ws.ping;
            console.log(`📊 [إحصائية] سرعة الـ WebSocket الحالية: ${apiPing}ms`);
            
            return await interaction.reply({ 
                content: `🚀 **سرعة استجابة النظام الحالية:**\n📡 سرعة البوت: \`${apiPing}ms\`\n🟢 الحالة: متصل ومستقر تماماً.`, 
                ephemeral: true 
            });
        } catch (pingError) {
            console.error('❌ خطأ أثناء تنفيذ أمر البينج:', pingError);
        }
    }

    // [معالجة أمر broadcast] - يتم تحويله وتنفيذه من ملفه المستقل
    if (commandName === 'broadcast') {
        try {
            console.log('📢 [برودكاست] جاري تمرير التحكم إلى ملف broadcast.ts...');
            return await broadcastCommand.execute(interaction);
        } catch (broadcastError) {
            console.error('❌ خطأ حرج في تشغيل ملف البرودكاست المدمج:', broadcastError);
            return await interaction.reply({ 
                content: '❌ حدث خطأ داخلي أثناء تشغيل البرودكاست الذكي، يرجى التحقق من لوغات ريلواي.', 
                ephemeral: true 
            });
        }
    }
});

// --- 4. نظام الشات المتكامل (Message Create): يشمل الفلترة المتقدمة وأوامر الـ (!) الممتدة ---
client.on('messageCreate', async (message) => {
    // تجاهل أي رسالة صادرة من البوتات لحماية النظام من الدوران اللانهائي (Loop)
    if (message.author.bot) return;

    // 🌐 [أولاً: نظام الحماية التلقائي واللوق الملون للشات]
    const contentLowerCase = message.content.toLowerCase();
    const hasBadWord = BLACKLISTED_WORDS.some(word => contentLowerCase.includes(word));

    if (hasBadWord) {
        try {
            console.log(`🚨 [مخالفة شات] تم رصد كلمة ممنوعة من: ${message.author.tag} الحذف قيد التنفيذ...`);
            
            // حذف الرسالة فوراً لحماية الشات
            await message.delete().catch(() => {
                console.log('⚠️ لم يتمكن البوت من حذف الرسالة، تأكد من صلاحية إدارة الرسائل للرتبة.');
            });

            // البحث التلقائي الذكي عن أي روم مخصص للوق والتقارير في السيرفر
            const logChannel = message.guild.channels.cache.find(channel => 
                channel.name.includes('log') && channel.type === ChannelType.GuildText
            );

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🚨 نظام المراقبة التلقائي - رصد مخالفة شات')
                    .setDescription(`تم حذف رسالة تحتوي على عبارات غير لائقة لحماية أمن السيرفر.`)
                    .addFields(
                        { name: '👤 العضو المخالف:', value: `${message.author} (${message.author.tag})`, inline: true },
                        { name: '📍 الروم النصي:', value: `${message.channel}`, inline: true },
                        { name: '📄 نص الرسالة المحذوفة:', value: `||${message.content}||` }
                    )
                    .setColor(0xED4245) // اللون الأحمر للتحذيرات
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
                console.log(`✅ تم إرسال تقرير الحذف إلى روم اللوق: #${logChannel.name}`);
            }
        } catch (filterError) {
            console.error('❌ فشل نظام الفلتر التلقائي في إكمال المهمة:', filterError);
        }
        return; // ننهي العملية هنا تماماً، العضو المخالف لا يحق له تشغيل أوامر
    }

    // 🛠️ [ثانياً: معالجة وفك تفاصيل الأوامر التي تبدأ بـ !]
    if (!message.content.startsWith(PREFIX)) return;

    // تقسيم النص لتفكيك اسم الأمر والخيارات المكتوبة بعده (Arguments)
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    console.log(`⚙️ [أمر نصي] تم طلب أمر الإدارة: !${command} بواسطة: ${message.author.tag}`);

    // 📋 [قائمة المساعدة والإرشاد للإدارة - !help]
    if (command === 'help' || command === 'اوامر') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🛡️ لوحة أوامر سيرفر أسامة المتكاملة')
            .setDescription('مرحباً بك في لوحة التحكم، إليك تفاصيل الأوامر المتاحة في هذا التحديث الجديد والمقسمة بعناية:')
            .addFields(
                { name: '🌐 أوامر السلاش الذكية (/)', value: '` /ping ` - لفحص سرعة استجابة البوت تلقائياً\n` /broadcast ` - إرسال برودكاست للأعضاء خاص مع تقرير لوحة ذكي ومربع مخصص', inline: false },
                { name: '⚔️ أوامر إدارة الشات والأعضاء المباشرة (!)', value: '` !clear [العدد] ` - تنظيف وتطهير رسائل الشات الحالية بسرعة وسلاسة\n` !kick [@منشن] ` - طرد العضو المخالف من السيرفر فوراً\n` !ban [@منشن] ` - حظر العضو ومنعه من الدخول مجدداً نهائياً', inline: false }
            )
            .setColor(0x3498DB)
            .setFooter({ text: 'تمت البرمجة والتطوير بكل احترافية 💻' })
            .setTimestamp();

        return await message.reply({ embeds: [helpEmbed] });
    }

    // 🧹 [أمر مسح الشات - !clear]
    if (command === 'clear' || command === 'مسح') {
        try {
            // التحقق الفوري من امتلاك الشخص لصلاحية إدارة الرسائل المعتمدة
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return await message.reply('❌ **خطأ أمني:** ليس لديك الصلاحية الكافية (إدارة الرسائل) لاستخدام هذا الأمر الإداري الحساس.');
            }

            const amount = parseInt(args[0]);
            
            // التحقق من صحة الرقم المدخل ونطاقه البرمجي المسموح
            if (isNaN(amount) || amount > 100 || amount < 1) {
                return await message.reply('❌ **تنبيه الإدارة:** يرجى كتابة رقم صحيح ومقبول بين `1` و `100` بعد الأمر مباشرة.\n💡 مثال صحيح للتنظيف: `!clear 25`');
            }

            // تنفيذ عملية الحذف الموسع في الروم الحالي
            await message.channel.bulkDelete(amount, true)
                .then(async (deletedMessages) => {
                    console.log(`🧹 [تنظيف] تم حذف ${deletedMessages.size} رسالة من الروم بنجاح.`);
                    
                    const successMessage = await message.channel.send(`🧹 **تم تنظيف الروم وتطهير الحسابات بنجاح!**\n🗑️ عدد الرسائل المحذوفة: \`${deletedMessages.size}\` رسالة.`);
                    
                    // حذف رسالة تأكيد البوت تلقائياً بعد 4 ثوانٍ لضمان بقاء الغرفة نظيفة تماماً
                    setTimeout(() => successMessage.delete().catch(() => {}), 4000);
                });
        } catch (clearCommandError) {
            console.error('❌ خطأ حرج أثناء محاولة مسح الشات التلقائي:', clearCommandError);
            return await message.reply('❌ **فشل النظام:** لم أتمكن من إتمام عملية الحذف. يرجى التأكد من رفع رتبة البوت وتفعيل صلاحية **Manage Messages** له.');
        }
    }

    // 👟 [أمر طرد الأعضاء - !kick]
    if (command === 'kick' || command === 'طرد') {
        try {
            if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                return await message.reply('❌ **خطأ أمني:** أنت لا تمتلك صلاحيات (طرد الأعضاء) في سيرفرك حالياً.');
            }

            const targetMember = message.mentions.members.first();
            if (!targetMember) {
                return await message.reply('❌ **تنبيه الإدارة:** يرجى تحديد العضو المستهدف بالمنشن لإتمام عملية الطرد بشكل قانوني.\n💡 مثال صحيح: `!kick @اسم_العضو`');
            }

            // التحقق من قابلية طرد الشخص برمجيًا (رتبته أعلى أم البوت أدنى منه)
            if (!targetMember.kickable) {
                return await message.reply('❌ **حماية النظام:** فشل الإجراء! لا يمكنني طرد هذا العضو لأن رتبته أعلى من رتبة البوت في قائمة الأدوار.');
            }

            await targetMember.kick(`تم الطرد بواسطة المسؤول: ${message.author.tag}`);
            console.log(`✅ [إدارة] تم إبعاد العضو المخالف بنجاح: ${targetMember.user.tag}`);
            return await message.reply(`✅ **تم الإجراء:** تم طرد العضو المخالف **${targetMember.user.tag}** من السيرفر بنجاح ونقله خارج خريطة الرومات.`);
        } catch (kickCommandError) {
            console.error('❌ فشل كود الطرد النصي في معالجة الطلب:', kickCommandError);
            return await message.reply('❌ **حدث خطأ غير متوقع:** فشل تنفيذ الطرد، يرجى مراجعة إعدادات الرتب والصلاحيات العامة داخل السيرفر.');
        }
    }

    // 🔨 [أمر حظر الأعضاء النهائي - !ban]
    if (command === 'ban' || command === 'بند' || command === 'حظر') {
        try {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return await message.reply('❌ **خطأ أمني:** ليس لديك رتبة أو صلاحيات (حظر الأعضاء) المخولة لتنفيذ هذا الإجراء الحاسم.');
            }

            const targetBanMember = message.mentions.members.first();
            if (!targetBanMember) {
                return await message.reply('❌ **تنبيه الإدارة:** يرجى توجيه الحظر بمنشن العضو المطلوب بدقة.\n💡 مثال صحيح: `!ban @اسم_العضو`');
            }

            if (!targetBanMember.bannable) {
                return await message.reply('❌ **حماية النظام:** فشل الحظر، رتبة هذا الشخص محصنة أو أعلى من مستوى صلاحيات البوت الحالية.');
            }

            await targetBanMember.ban({ reason: `حظر نهائي إداري من المسؤول: ${message.author.tag}` });
            console.log(`🔨 [حظر حاسم] تم طرد وبند العضو نهائياً: ${targetBanMember.user.tag}`);
            return await message.reply(`🔨 **العقوبة نفذت:** تم حظر العضو **${targetBanMember.user.tag}** من الخادم نهائياً وتدوين الحظر في لوحة ديسكورد الرسمية.`);
        } catch (banCommandError) {
            console.error('❌ فشل كود البند النصي في معالجة الحظر المباشر:', banCommandError);
            return await message.reply('❌ **فشل تام:** تعذر إكمال البند والحظر، تأكد من أن رتبة البوت في أعلى القائمة ومفعل لها خيار **Ban Members**.');
        }
    }
});

// --- 5. تسجيل الدخول والربط النهائي بالنظام البرمجي الآمن ---
if (!TOKEN) {
    console.error('❌ [خطأ فادح] رمز توكن الديسكورد (DISCORD_TOKEN) مفقود في متغيرات ريلواي البيئية! البوت لن يشتغل.');
    process.exit(1);
}

client.login(TOKEN).catch((loginError) => {
    console.error('❌ [فشل الربط] لم يتمكن البوت من تسجيل الدخول إلى ديسكورد، التوكن قد يكون غير صحيح:', loginError);
});
