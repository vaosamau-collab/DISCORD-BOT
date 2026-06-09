// @ts-nocheck
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

const BLACKLISTED_WORDS = ["زق", "كلب", "خرا"];

client.once('ready', () => {
    console.log('====================================================');
    console.log('✅ تم تشغيل البوت بنجاح.. جاهزين للدوام!');
    console.log('====================================================');

    client.user.setPresence({
        activities: [{ name: 'أحرس السيرفر | ?help', type: ActivityType.Custom }],
        status: 'online',
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
            
            // نرسل تنبيه في الشات ينحذف بسرعة
            const warning = await message.channel.send(`روقنا يا ${message.author}، الكلمة هذي ممنوعة بالسيرفر 🌹`);
            setTimeout(() => warning.delete().catch(() => {}), 3000);

            // لوق الإدارة
            const logChannel = message.guild.channels.cache.find(ch => ch.name.includes('log') && ch.type === ChannelType.GuildText);
            if (logChannel) {
                const filterEmbed = new EmbedBuilder()
                    .setTitle('🗑️ مسح رسالة مخالفة')
                    .addFields(
                        { name: 'العضو:', value: `${message.author}`, inline: true },
                        { name: 'الروم:', value: `${message.channel}`, inline: true },
                        { name: 'الرسالة:', value: `||${message.content}||` }
                    )
                    .setColor(0xED4245)
                    .setTimestamp();

                await logChannel.send({ embeds: [filterEmbed] });
            }
        } catch (err) { console.error(err); }
        return; 
    }

    // 📋 [2. لوحة المساعدة - ?help]
    if (message.content === '?help' || message.content === '?اوامر') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('📜 قائمة أوامر السيرفر')
            .setDescription('هذي كل الأوامر اللي تقدر تستخدمها في البوت:')
            .addFields(
                { name: '🌐 أوامر عامة ( - )', value: '` -ping ` - عشان تشوف بنق وسرعة البوت\n` -broadcast ` - إرسال رسالة لخاص كل الأعضاء', inline: false },
                { name: '🛡️ أوامر الإدارة ( ! )', value: '` !clear ` - مسح الشات (اكتب عدد الرسايل)\n` !kick ` - طرد عضو من السيرفر\n` !ban ` - تبنيد عضو نهائي', inline: false }
            )
            .setColor(0x2B2D31) // لون رمادي رايق زي لون ديسكورد
            .setTimestamp();

        return await message.reply({ embeds: [helpEmbed] });
    }

    // ⚡ [3. أوامر الداش ( - )]
    if (message.content.startsWith(USER_PREFIX)) {
        const args = message.content.slice(USER_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // [أمر -ping]
        if (command === 'ping') {
            const apiPing = client.ws.ping;
            return await message.reply(`📶 بنق البوت الحين: \`${apiPing}ms\``);
        }

        // [أمر -broadcast]
        if (command === 'broadcast') {
            return await broadcastCommand.execute(message, args);
        }
    }

    // ⚙ [4. أوامر الإدارة ( ! )]
    if (message.content.startsWith(ADMIN_PREFIX)) {
        const args = message.content.slice(ADMIN_PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // [أمر !clear]
        if (command === 'clear' || command === 'مسح') {
            try {
                if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return await message.reply('❌ معليش، ما عندك صلاحية تمسح الرسايل.');
                }

                const amount = parseInt(args[0]);
                if (isNaN(amount) || amount > 100 || amount < 1) {
                    return await message.reply('⚠ ياليت تكتب رقم بين 1 و 100. مثال: `!clear 10`');
                }

                await message.channel.bulkDelete(amount, true)
                    .then(async (deletedMessages) => {
                        const successMessage = await message.channel.send(`🧹 تم مسح \`${deletedMessages.size}\` رسالة.`);
                        setTimeout(() => successMessage.delete().catch(() => {}), 4000); 
                    });
            } catch (err) {
                return await message.reply('❌ صارت مشكلة وأنا أمسح الرسايل، تأكد من صلاحياتي.');
            }
        }

        // [أمر !kick]
        if (command === 'kick' || command === 'طرد') {
            try {
                if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                    return await message.reply('❌ معليش، ما عندك صلاحية تطرد أعضاء.');
                }

                const targetMember = message.mentions.members.first();
                if (!targetMember) return await message.reply('⚠ لازم تمنشن الشخص اللي تبي تطرده.');
                if (!targetMember.kickable) return await message.reply('❌ ما أقدر أطرد هذا الشخص، يمكن رتبته أعلى مني.');

                await targetMember.kick(`تم الطرد بواسطة الإداري: ${message.author.tag}`);
                return await message.reply(`👟 تم طرد **${targetMember.user.tag}** من السيرفر.`);
            } catch (err) { return await message.reply('❌ صارت مشكلة وما قدرت أطرده.'); }
        }

        // [أمر !ban]
        if (command === 'ban' || command === 'بند' || command === 'حظر') {
            try {
                if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                    return await message.reply('❌ معليش، ما عندك صلاحية تبند أعضاء.');
                }

                const targetBanMember = message.mentions.members.first();
                if (!targetBanMember) return await message.reply('⚠ لازم تمنشن الشخص اللي تبي تبنده.');
                if (!targetBanMember.bannable) return await message.reply('❌ ما أقدر أبند هذا الشخص، تأكد من ترتيب الرتب.');

                await targetBanMember.ban({ reason: `تم التبنيد بواسطة الإداري: ${message.author.tag}` });
                return await message.reply(`🔨 تم تبنيد **${targetBanMember.user.tag}** نهائياً.`);
            } catch (err) { return await message.reply('❌ صارت مشكلة وما قدرت أبنده.'); }
        }
    }
});

client.login(TOKEN);
