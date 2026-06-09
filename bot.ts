// @ts-nocheck
/**
 * 👑 نظام الخصومة والفزعات المتكامل لسيرفر أسامة (Na5p)
 * التحديث الأخير: نقل أمر المساعدة ليكون المرجع المحايد (?help)
 * الأطراف: جبهة عساكر الإدارة (!) ضد جبهة ثوار الشوارع (-)
 */

import { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActivityType,
    PermissionFlagsBits,
    ChannelType
} from 'discord.js';
import * as broadcastCommand from './broadcast.js';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ] 
});

const TOKEN = process.env.DISCORD_TOKEN;
const ADMIN_PREFIX = "!"; 
const USER_PREFIX = "-";  
const HELP_PREFIX = "?"; // علامة المرجع المحايد

const BLACKLISTED_WORDS = ["زق", "كلب", "خرا"];

// قائمة سيناريوهات الفزعة العشوائية لـأمر الهيلة الشعبي (-)
const SHABI_HAILA_SCENARIOS = [
    "🚨 **[ غارة الشوارع ]:** فزعتنا وصلت! شباب الحارة نزلوا بجموس حمر، كسروا مكاتب الإدارة وقبعات العساكر، والحين منكسين لوحة الـ (!) في نص السيرفر! الـ (-) يكتب التاريخ يا أسامة! 🦅🔥",
    "🎤 **[ ديس الساحة الجماعي ]:** زلزلنا الأرض وجيناكم.. فزعة الهيلة تعمي عيونكم! قروب الـ (-) نزل ديس تراك 3 دقائق فجر فيه رادارات الإدارة وخلا الجنرال `!` يراجع حساباته ويبكي بالخاص! 💀🎧",
    "📦 **[ غنائم الحرب ]:** هبطت طائرة الدعم الشعبية، وزعنا كوينز وبرودكاست مجاني على كل السيرفر، وقفلنا غرف التحقيق حقت الـ (!) بالشمع الأحمر! الشارع محكوم بالـ (-) الحين! 💰🤙"
];

// قائمة سيناريوهات الفزعة العشوائية لـأمر الهيلة العسكري (!)
const MILITARY_HAILA_SCENARIOS = [
    "🚀 **[ الإنزال الجوي الحاسم ]:** طائرات الإدارة الحربية حاصرت رومات الشات! قوات الـ (!) الخاصة نزلت بحبال وقبضت على قادة التمرد حارتكم الحين تحت الحظر التجولي التام! ابلععع 🪂💥",
    "🔨 **[ مطرقة العدالة ]:** صدر حكم محكمة أسامة العليا! تم تفعيل وضعية 'الهيلة العسكرية'، قصفنا جبهة الداش (-) بصاروخ أرض-جو برمجياً، ومسحنا هيبته وصار يدور رتبة فري فاير من الخوف! ⚔️🚨",
    "🛡️ **[ فرض الهيبة المطلقة ]:** جدران الحماية حقت الـ (!) تقفلت، سحبنا مايكات الثوار، وأي واحد يكتب (-) بيلقى روحه في روم اللوق يكتب تعهد خطي للقائد أسامة! النظام لا يرحم! 👮‍♂️🔒"
];

client.once('ready', () => {
    console.log('====================================================');
    console.log('⚔️ تم تشغيل النظام بنجاح بواسطة أسامة!');
    console.log('🔥 [أمر المساعدة] تم تحويله للعلامة المحايدة (?help).');
    console.log('====================================================');

    // تغيير حالة البوت عشان الناس تعرف أن الأمر صار ?help
    client.user.setPresence({
        activities: [{ name: '🔥 معركة الهيلة الكبرى | ?help', type: ActivityType.Custom }],
        status: 'dnd',
    });
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return; 

    // 🌐 [1. نظام الفلتر التلقائي للشات]
    const contentLowerCase = message.content.toLowerCase();
    const hasBadWord = BLACKLISTED_WORDS.some(word => contentLowerCase.includes(word));

    if (hasBadWord) {
        try {
            await message.delete().catch(() => {});
            const logChannel = message.guild.channels.cache.find(ch => ch.name.includes('log') && ch.type === ChannelType.GuildText);

            if (logChannel) {
                const filterEmbed = new EmbedBuilder()
                    .setTitle('🚨 تدخل سريع من قوات (!) الصارمة')
                    .setDescription('تم سحق رسالة مخالفة وتطهير الشات فوراً!')
                    .addFields(
                        { name: '👤 العضو المستهدف:', value: `${message.author}`, inline: true },
                        { name: '💬 رد جبهة (-):', value: 'كفو ريحتنا من كلامه 🤝', inline: true }
                    )
                    .setColor(0xED4245)
                    .setTimestamp();

                await logChannel.send({ embeds: [filterEmbed] });
            }
        } catch (err) { console.error(err); }
        return; 
    }

    // 📋 [2. لوحة المساعدة المحايدة والمطورة بالكامل - ?help]
    if (message.content === '?help' || message.content === '?اوامر') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('⚖️ الصحيفة الرسمية لمعركة سيرفر أسامة (دليل الأوامر)')
            .setDescription('أهلاً بك في المنطقة المحايدة! السيرفر حالياً يعيش حرب طاحنة بين جهتين، وهذي قائمة بالأسلحة المتوفرة لكل جهة:')
            .addFields(
                { name: '🔵 أسلحة ثوار الشوارع ( - )', value: '` -ping ` - فحص البينج وقهر الطرف الثاني\n` -broadcast ` - تفجير الخاص الذكي بتقرير مخصص\n` -هيله ` أو ` -هيلة ` - فزعة شعبية عشوائية لجلد عساكر الإدارة! 🔥', inline: false },
                { name: '🔴 أسلحة جنرالات القانون ( ! )', value: '` !clear ` - تنظيف وتطهير الشات بقوة السلاح\n` !kick ` - طرد المشاغبين خارج الحدود\n` !ban ` - إعدام وبند نهائي من السيرفر\n` !هيله ` أو ` !هيلة ` - إنزال جوي عسكري لقمع التمرد! 🛡️', inline: false }
            )
            .setColor(0xF1C40F) // لون ذهبي/أصفر يدل على الحياد والمرجع
            .setFooter({ text: 'المرجع الرسمي والأعلى تحت إدارة: أسامة 👑' })
            .setTimestamp();

        return await message.reply({ embeds: [helpEmbed] });
    }

    // ⚡ [3. معالجة وتفصيل أوامر علامة الداش ( - )]
    if (message.content.startsWith(USER_PREFIX)) {
        const args = message.content.slice(USER_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // [أمر -هيله المطور]
        if (command === 'هيله' || command === 'هيلة') {
            const randomScen = SHABI_HAILA_SCENARIOS[Math.floor(Math.random() * SHABI_HAILA_SCENARIOS.length)];
            
            const hailaEmbed = new EmbedBuilder()
                .setTitle('🦅 فزعة الهيلة الشعبية نزلواااا!')
                .setDescription(randomScen)
                .addFields({ 
                    name: '🗣️ لسان حال الشارع يقول:', 
                    value: 'يا إدارة يا عساكر جمعوا راداراتكم واقفلوا مكاتبكم، الحارة نزلت بكامل عتادها وما نعترف بقوانينكم! 💥🛒' 
                })
                .setColor(0x00FFFF)
                .setTimestamp();

            return await message.reply({ content: '📢 **فززززززعة!**', embeds: [hailaEmbed] });
        }

        // [أمر -ping وفيه رد الخصم !]
        if (command === 'ping') {
            const apiPing = client.ws.ping;
            const pingEmbed = new EmbedBuilder()
                .setTitle('📡 استعراض سرعة جبهة ( - )')
                .setDescription(`🚀 سرعة اتصالي الحين هي: \`${apiPing}ms\`\n🟢 جاهز لجلد الخصوم بدون سلاش وبأعلى استقرار!`)
                .addFields({ 
                    name: '🎤 قصف الجبهة المضاد:', 
                    value: `**البريفكس (!):** فرحان بالبينج حقك؟ سرعتك هذي أنا اللي معطيك إياها من سيرفر الإدارة، انثبر بس! 😂` 
                })
                .setColor(0x00FF00)
                .setTimestamp();

            return await message.reply({ embeds: [pingEmbed] });
        }

        if (command === 'broadcast') {
            return await broadcastCommand.execute(message, args);
        }
    }

    // ⚙ [4. معالجة وتفصيل أوامر علامة التعجب ( ! )]
    if (message.content.startsWith(ADMIN_PREFIX)) {
        const args = message.content.slice(ADMIN_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // [أمر !هيله المطور]
        if (command === 'هيله' || command === 'هيلة') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return await message.reply('❌ **[الجنرال !]:** انثبر! تبي تستدعي قوات الدعم السريع حقتي وأنت عسكري عادي؟ ارجع خفير!');
            }

            const randomMilScen = MILITARY_HAILA_SCENARIOS[Math.floor(Math.random() * MILITARY_HAILA_SCENARIOS.length)];

            const milHailaEmbed = new EmbedBuilder()
                .setTitle('🚨 إعلان حالة الطوارئ - هيلة القيادة العليا!')
                .setDescription(randomMilScen)
                .addFields({ 
                    name: '👮‍♂️ قرار جنرالات ديسكورد الصارم:', 
                    value: 'تم سحق رومات المشاغبين، السيرفر الحين تحت حماية القانون الإداري المطلق، والتمرد انتهى! 🛡️🔨' 
                })
                .setColor(0xFF0000)
                .setTimestamp();

            return await message.reply({ content: '⚡ **إنزال عسكري حاسم!**', embeds: [milHailaEmbed] });
        }

        // [أمر !clear الإداري]
        if (command === 'clear' || command === 'مسح') {
            try {
                if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return await message.reply('❌ **[الجنرال !]:** انثبر مكانك، ما عندك صلاحية تمسح شات أسامة!');
                }

                const amount = parseInt(args[0]);
                if (isNaN(amount) || amount > 100 || amount < 1) {
                    return await message.reply('❌ **[الجنرال !]:** حط رقم من 1 إلى 100 بعد الأمر عشان نشتغل صح.');
                }

                await message.channel.bulkDelete(amount, true)
                    .then(async (deletedMessages) => {
                        const clearEmbed = new EmbedBuilder()
                            .setTitle('🧹 تم التطهير بواسطة سلطة ( ! )')
                            .setDescription(`حذفت بقوة القانون \`${deletedMessages.size}\` رسالة من الشات!`)
                            .addFields({ 
                                name: '🎤 قصف الجبهة المضاد:', 
                                value: `**البريفكس (-):** تمسح الشات عشان تخفي فضايحك وجبهتك المكسورة؟ الأعضاء كاشفينا وعرفوا الملك الحقيقي! 🤫🔥` 
                            })
                            .setColor(0xED4245)
                            .setTimestamp();

                        const successMessage = await message.channel.send({ embeds: [clearEmbed] });
                        setTimeout(() => successMessage.delete().catch(() => {}), 6000); 
                    });
            } catch (err) {
                return await message.reply('❌ **[الجنرال !]:** تعذر الحذف، المتمردين مسوين جدار قوي!');
            }
        }

        // [أمر !kick الإداري]
        if (command === 'kick' || command === 'طرد') {
            try {
                if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                    return await message.reply('❌ **[الجنرال !]:** الصلاحية هذي مخصصة للقادة الكبار فقط.');
                }

                const targetMember = message.mentions.members.first();
                if (!targetMember) return await message.reply('❌ **[الجنرال !]:** منشن الشخص المستهدف بالمنشن عشان نشوته.');
                if (!targetMember.kickable) return await message.reply('❌ **[الجنرال !]:** هذا محصن رتبته أعلى مني ومنك!');

                await targetMember.kick(`بواسطة قوة القانون !`);
                
                const kickEmbed = new EmbedBuilder()
                    .setTitle('👟 تم النفي خارج السيرفر بنجاح')
                    .setDescription(`✅ غادر العضو **${targetMember.user.tag}** مطروداً بأمر من القيادة (!)`)
                    .addFields({ 
                        name: '🎤 قصف الجبهة المضاد:', 
                        value: `**البريفكس (-):** قوتك بس على المساكين، لو فيك خير تعال منشني أنا واطردني.. أوه صح ما تقدر لأنني كود برمجت أساسك! ابلع 💀🔥` 
                    })
                    .setColor(0xE67E22)
                    .setTimestamp();

                return await message.reply({ embeds: [kickEmbed] });
            } catch (err) { return await message.reply('❌ **[الجنرال !]:** تعذر الطرد.'); }
        }

        // [أمر !ban الإداري حظر نهائي]
        if (command === 'ban' || command === 'بند' || command === 'حظر') {
            try {
                if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                    return await message.reply('❌ **[الجنرال !]:** ابعد عن زر البند لا تطير يدك، صلاحيتك ناقصة.');
                }

                const targetBanMember = message.mentions.members.first();
                if (!targetBanMember) return await message.reply('❌ **[الجنرال !]:** عطني منشن الضحية عشان أنهي مسيرته.');
                if (!targetBanMember.bannable) return await message.reply('❌ **[الجنرال !]:** رتبته حديد وقوية ما ينبلع.');

                await targetBanMember.ban({ reason: `حظر عسكري نهائي وصارم` });
                
                const banEmbed = new EmbedBuilder()
                    .setTitle('🔨 عقوبة الإعدام والبند النهائي')
                    .setDescription(`🔨 تم تدمير ملف **${targetBanMember.user.tag}** وحظره من الدخول للأبد بقوة الأحكام (!)`)
                    .addFields({ 
                        name: '🎤 قصف الجبهة المضاد:', 
                        value: `**البريفكس (-):** بندته نهائي؟ طيب والخاص حقه؟ أنا للحين أقدر أرسل له برودكاست وأسولف معاه وأنت جالس هنا زي الصنم! واصل لأبعد من جدرانك! 🎤🤫` 
                    })
                    .setColor(0x9B59B6)
                    .setTimestamp();

                return await message.reply({ embeds: [banEmbed] });
            } catch (err) { return await message.reply('❌ **[الجنرال !]:** فشل البند الحاسم.'); }
        }
    }
});

client.login(TOKEN);
