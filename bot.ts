// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

client.once('ready', async () => {
    try {
        const commands = [
            new SlashCommandBuilder().setName('ping').setDescription('فحص سرعة الاتصال'),
            new SlashCommandBuilder().setName('clear').setDescription('مسح الرسائل من الشات').addIntegerOption(o => o.setName('amount').setDescription('عدد الرسائل المراد مسحها').setRequired(true)),
            new SlashCommandBuilder().setName('kick').setDescription('طرد عضو مخالف').addUserOption(o => o.setName('target').setDescription('العضو المراد طرده').setRequired(true)),
            new SlashCommandBuilder().setName('ban').setDescription('حظر عضو نهائياً').addUserOption(o => o.setName('target').setDescription('العضو المراد حظره').setRequired(true)),
            new SlashCommandBuilder().setName('broadcast').setDescription('برودكاست خاص مع تقرير ذكي').addStringOption(o => o.setName('message').setDescription('نص الرسالة جماعية').setRequired(true))
        ].map(cmd => cmd.toJSON());

        const rest = new REST({ version: '10' }).setToken(TOKEN);
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log(`✅ البوت جاهز ونظام التقرير الذكي نشط!`);
    } catch (error) {
        console.log('خطأ في التسجيل تم تجاوزه');
    }
});

client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;

    if (i.commandName === 'ping') {
        return await i.reply({ content: `🚀 البينج الحالي: **${client.ws.ping}ms**`, ephemeral: true });
    }

    // --- أمر البرودكاست الذكي بالتقرير الشامل ---
    if (i.commandName === 'broadcast') {
        if (!i.member.permissions.has('ManageGuild')) {
            return await i.reply({ content: '❌ هذا الأمر مخصص للإدارة فقط!', ephemeral: true });
        }

        const broadcastMessage = i.options.getString('message');
        
        // الرسالة التي ستصل للأعضاء
        const userEmbed = new EmbedBuilder()
            .setTitle(`📢 رسالة جماعية من سيرفر: ${i.guild.name}`)
            .setDescription(broadcastMessage)
            .setColor(0x00FFFF)
            .setTimestamp();

        await i.reply({ content: '🔄 جاري بدء الإرسال وإعداد التقرير التلقائي...', ephemeral: true });

        const members = await i.guild.members.fetch();
        let successCount = 0;
        let failCount = 0;
        let reportText = ""; // لستة اليوزرات مع العلامات

        for (const [id, member] of members) {
            if (member.user.bot) continue; // تخطي البوتات الأخرى

            try {
                await member.send({ embeds: [userEmbed] });
                successCount++;
                reportText += `✅ ${member.user.username}\n`;
            } catch (err) {
                failCount++;
                reportText += `❌ ${member.user.username}\n`;
            }
        }

        // لو القائمة طويلة جداً، نختصرها عشان ما يضرب كود ديسكورد (الحد الأقصى 2048 حرف في الوصف)
        if (reportText.length > 1800) {
            reportText = reportText.substring(0, 1800) + "\n... وتوجد أسماء أخرى بالأعلى";
        }

        // إنشاء المربع (Embed) النهائي الخاص بأسامة
        const reportEmbed = new EmbedBuilder()
            .setTitle('📊 تقرير تسليم البرودكاست الشامل')
            .setDescription(`**حالة الإرسال لكل عضو:**\n\`\`\`text\n${reportText || "لا يوجد أعضاء في السيرفر"}\n\`\`\``)
            .addFields(
                { name: '🟢 تم الإرسال لهم بنجاح:', value: `\`${successCount}\` عضو`, inline: true },
                { name: '🔴 فشل الإرسال (مقفل الخاص):', value: `\`${failCount}\` عضو`, inline: true }
            )
            .setColor(0x00FF00)
            .setTimestamp()
            .setFooter({ text: 'نظام إدارة سيرفر أسامة التلقائي 🛡️' });

        // إرسال المربع الفخم لك في الشات (مخفي عن الأعضاء عشان الخصوصية)
        return await i.followUp({ embeds: [reportEmbed], ephemeral: true });
    }

    // أمر المسح وباقي الأوامر
    if (i.commandName === 'clear') {
        try {
            const amount = i.options.getInteger('amount');
            if (amount > 100 || amount < 1) return i.reply({ content: '❌ اختر رقم بين 1 و 100', ephemeral: true });
            await i.channel.bulkDelete(amount, true);
            return await i.reply({ content: `🧹 تم مسح ${amount} رسالة بنجاح!`, ephemeral: true });
        } catch (err) {
            return await i.reply({ content: `❌ فشل المسح! تأكد من صلاحية البوت.`, ephemeral: true });
        }
    }

    if (i.commandName === 'kick') {
        try {
            const member = i.options.getMember('target');
            await member.kick();
            return await i.reply({ content: `✅ تم طرد ${member.user.tag}`, ephemeral: true });
        } catch (err) { return i.reply({ content: '❌ فشل الطرد', ephemeral: true }); }
    }

    if (i.commandName === 'ban') {
        try {
            const member = i.options.getMember('target');
            await member.ban();
            return await i.reply({ content: `🔨 تم حظر ${member.user.tag}`, ephemeral: true });
        } catch (err) { return i.reply({ content: '❌ فشل الحظر', ephemeral: true }); }
    }
});

client.login(TOKEN);
