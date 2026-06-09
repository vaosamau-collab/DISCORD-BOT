// @ts-nocheck
import { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActivityType,
    PermissionFlagsBits,
    ChannelType
} from 'discord.js';
import * as broadcastCommand from './broadcast.js'; // استدعاء ملف البرودكاست الجديد

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

const ADMIN_PREFIX = "!"; // علامة أوامر الإدارة (clear, kick, ban)
const USER_PREFIX = "-";  // العلامة الجديدة لأوامر (ping, broadcast)

const BLACKLISTED_WORDS = ["زق", "كلب", "خرا"];

// --- حدث تشغيل البوت وتهيئة الحالة ---
client.once('ready', () => {
    console.log('====================================================');
    console.log(`🤖 تم تشغيل نظام البوت بنجاح بواسطة أسامة!`);
    console.log(`📡 اسم البوت: ${client.user.tag}`);
    console.log('====================================================');

    client.user.setPresence({
        activities: [{ name: '🛡️ إدارة سيرفر أسامة | -help', type: ActivityType.Custom }],
        status: 'online',
    });
});

// --- نظام الشات الكامل والمراقبة والأوامر النصية ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // حماية من التكرار اللانهائي

    // 🌐 [أولاً: نظام الحماية التلقائي والفلتر للشات]
    const contentLowerCase = message.content.toLowerCase();
    const hasBadWord = BLACKLISTED_WORDS.some(word => contentLowerCase.includes(word));

    if (hasBadWord) {
        try {
            await message.delete().catch(() => {});
            const logChannel = message.guild.channels.cache.find(ch => ch.name.includes('log') && ch.type === ChannelType.GuildText);

            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🚨 نظام المراقبة التلقائي - رصد مخالفة شات')
                    .setDescription(`تم حذف رسالة تحتوي على عبارات غير لائقة لحماية أمن السيرفر.`)
                    .addFields(
                        { name: '👤 العضو المخالف:', value: `${message.author} (${message.author.tag})`, inline: true },
                        { name: '📍 الروم النصي:', value: `${message.channel}`, inline: true },
                        { name: '📄 نص الرسالة المحذوفة:', value: `||${message.content}||` }
                    )
                    .setColor(0xED4245)
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }
        } catch (err) { console.error(err); }
        return; 
    }

    // 📋 [ثانياً: قائمة المساعدة والإرشاد الشاملة - -help]
    if (message.content === '-help' || message.content === '-اوامر') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🛡️ لوحة أوامر سيرفر أسامة المتكاملة')
            .setDescription('مرحباً بك في لوحة التحكم، إليك تفاصيل الأوامر الجديدة والمقسمة حسب العلامات:')
            .addFields(
                { name: '🌐 أوامر العلامة العامة ( - )', value: '` -ping ` - لفحص سرعة استجابة واتصال البوت\n` -broadcast [النص] ` - برودكاست للأعضاء خاص مع تقرير لوحة ذكي بمربع مخصص', inline: false },
                { name: '⚔️ أوامر الإدارة الحساسة ( ! )', value: '` !clear [العدد] ` - تنظيف وتطهير رسائل الشات الحالية بسرعة\n` !kick [@منشن] ` - طرد العضو المخالف من السيرفر فوراً\n` !ban [@منشن] ` - حظر العضو ومنعه من الدخول مجدداً نهائياً', inline: false }
            )
            .setColor(0x3498DB)
            .setFooter({ text: 'تمت البرمجة والتطوير بكل احترافية لأسامة 💻' })
            .setTimestamp();

        return await message.reply({ embeds: [helpEmbed] });
    }

    // ⚡ [ثالثاً: تشغيل أوامر علامة الداش ( - )]
    if (message.content.startsWith(USER_PREFIX)) {
        const args = message.content.slice(USER_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // أمر فحص السرعة: -ping
        if (command === 'ping') {
            const apiPing = client.ws.ping;
            return await message.reply(`🚀 **سرعة استجابة النظام الحالية:** \`${apiPing}ms\`\n🟢 الحالة: متصل ومستقر تماماً وبدون سلاش!`);
        }

        // أمر البرودكاست المطور من ملفه: -broadcast
        if (command === 'broadcast') {
            return await broadcastCommand.execute(message, args);
        }
    }

    // ⚙️ [رابعاً: تشغيل أوامر علامة التعجب ( ! ) حقت الإدارة]
    if (message.content.startsWith(ADMIN_PREFIX)) {
        const args = message.content.slice(ADMIN_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // أمر مسح الشات: !clear 10
        if (command === 'clear' || command === 'مسح') {
            try {
                if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return await message.reply('❌ **خطأ أمني:** ليس لديك الصلاحية الكافية لاستخدام هذا الأمر.');
                }

                const amount = parseInt(args[0]);
                if (isNaN(amount) || amount > 100 || amount < 1) {
                    return await message.reply('❌ **تنبيه:** يرجى كتابة رقم صحيح بين `1` و `100` بعد الأمر. مثال: `!clear 25`');
                }

                await message.channel.bulkDelete(amount, true)
                    .then(async (deletedMessages) => {
                        const successMessage = await message.channel.send(`🧹 **تم تنظيف الروم بنجاح!** المحذوف: \`${deletedMessages.size}\` رسالة.`);
                        setTimeout(() => successMessage.delete().catch(() => {}), 4000);
                    });
            } catch (err) {
                return await message.reply('❌ **فشل النظام:** تأكد من رفع رتبة البوت وتفعيل صلاحية **Manage Messages** له.');
            }
        }

        // أمر طرد الأعضاء: !kick @user
        if (command === 'kick' || command === 'طرد') {
            try {
                if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                    return await message.reply('❌ **خطأ أمني:** أنت لا تمتلك صلاحية طرد الأعضاء.');
                }

                const targetMember = message.mentions.members.first();
                if (!targetMember) return await message.reply('❌ **تنبيه:** يرجى تحديد العضو المستهدف بالمنشن. مثال: `!kick @اسم_العضو`');
                if (!targetMember.kickable) return await message.reply('❌ **حماية النظام:** لا يمكنني طرد هذا العضو لأن رتبته أعلى من البوت.');

                await targetMember.kick(`تم الطرد بواسطة المسؤول: ${message.author.tag}`);
                return await message.reply(`✅ **تم الإجراء:** تم طرد العضو **${targetMember.user.tag}** بنجاح.`);
            } catch (err) { return await message.reply('❌ **حدث خطأ:** فشل تنفيذ أمر الطرد.'); }
        }

        // أمر حظر الأعضاء: !ban @user
        if (command === 'ban' || command === 'بند' || command === 'حظر') {
            try {
                if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                    return await message.reply('❌ **خطأ أمني:** ليس لديك صلاحية حظر الأعضاء.');
                }

                const targetBanMember = message.mentions.members.first();
                if (!targetBanMember) return await message.reply('❌ **تنبيه:** يرجى تحديد العضو بالمنشن. مثال: `!ban @اسم_العضو`');
                if (!targetBanMember.bannable) return await message.reply('❌ **حماية النظام:** فشل الحظر، رتبة الشخص محصنة أو أعلى من البوت.');

                await targetBanMember.ban({ reason: `حظر نهائي إداري من المسؤول: ${message.author.tag}` });
                return await message.reply(`🔨 **العقوبة نفذت:** تم حظر العضو **${targetBanMember.user.tag}** نهائياً.`);
            } catch (err) { return await message.reply('❌ **فشل تام:** تعذر إكمال البند والحظر.'); }
        }
    }
});

client.login(TOKEN);
