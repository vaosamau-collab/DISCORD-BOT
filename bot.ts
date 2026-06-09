// @ts-nocheck
/**
 * 👑 نظام الخصومة المتكامل لسيرفر أسامة (Na5p)
 * الأطراف: جبهة عساكر الإدارة (!) ضد جبهة ثوار الشوارع (-)
 * المرجع المحايد: (?help)
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
const HELP_PREFIX = "?"; 

const BLACKLISTED_WORDS = ["زق", "كلب", "خرا"];

client.once('ready', () => {
    console.log('====================================================');
    console.log('⚔️ تم تشغيل النظام بنجاح بواسطة أسامة!');
    console.log('🔥 الخصومة جاهزة بين ! و - والمرجع ?help نشط.');
    console.log('====================================================');

    client.user.setPresence({
        activities: [{ name: '🔥 حرب الشوارع | ?help', type: ActivityType.Custom }],
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

    // 📋 [2. لوحة المساعدة المحايدة - ?help]
    if (message.content === '?help' || message.content === '?اوامر') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('⚖️ الصحيفة الرسمية لمعركة سيرفر أسامة (دليل الأوامر)')
            .setDescription('أهلاً بك في المنطقة المحايدة! السيرفر حالياً يعيش حرب طاحنة بين جهتين، وهذي قائمة بالأسلحة المتوفرة:')
            .addFields(
                { name: '🔵 أسلحة ثوار الشوارع ( - )', value: '` -ping ` - فحص البينج وقهر الطرف الثاني\n` -broadcast ` - تفجير الخاص الذكي بتقرير مخصص', inline: false },
                { name: '🔴 أسلحة جنرالات القانون ( ! )', value: '` !clear ` - تنظيف وتطهير الشات بقوة السلاح\n` !kick ` - طرد المشاغبين خارج الحدود\n` !ban ` - إعدام وبند نهائي من السيرفر', inline: false }
            )
            .setColor(0xF1C40F) 
            .setFooter({ text: 'المرجع الرسمي والأعلى تحت إدارة: أسامة 👑' })
            .setTimestamp();

        return await message.reply({ embeds: [helpEmbed] });
    }

    // ⚡ [3. معالجة وتفصيل أوامر علامة الداش ( - )]
    if (message.content.startsWith(USER_PREFIX)) {
        const args = message.content.slice(USER_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // [أمر -ping]
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

        // [أمر -broadcast]
        if (command === 'broadcast') {
            return await broadcastCommand.execute(message, args);
        }
    }

    // ⚙ [4. معالجة وتفصيل أوامر علامة التعجب ( ! )]
    if (message.content.startsWith(ADMIN_PREFIX)) {
        const args = message.content.slice(ADMIN_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

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
