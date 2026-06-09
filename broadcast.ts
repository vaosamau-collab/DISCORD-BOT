// @ts-nocheck
import { EmbedBuilder, Message } from 'discord.js';

export async function execute(message: Message, args: string[]) {
    // التحقق من الصلاحيات
    if (!message.member.permissions.has('ManageGuild')) {
        return await message.reply('❌ معليش، هذا الأمر للإدارة بس.');
    }

    const broadcastMessage = args.join(' ');
    if (!broadcastMessage) {
        return await message.reply('⚠ ياليت تكتب الرسالة اللي تبي ترسلها. مثال: `-broadcast حياكم الله بالسيرفر`');
    }
    
    const userEmbed = new EmbedBuilder()
        .setTitle(`📢 إعلان من سيرفر: ${message.guild.name}`)
        .setDescription(broadcastMessage)
        .setColor(0x00FFFF)
        .setTimestamp();

    const statusMessage = await message.reply('⏳ جاري إرسال البرودكاست لخاص الأعضاء...');

    const members = await message.guild.members.fetch();
    let successCount = 0;
    let failCount = 0;

    for (const [id, member] of members) {
        if (member.user.bot) continue; 

        try {
            await member.send({ embeds: [userEmbed] });
            successCount++;
        } catch (err) {
            failCount++;
        }
    }

    const reportEmbed = new EmbedBuilder()
        .setTitle('📊 تقرير البرودكاست')
        .addFields(
            { name: '✅ وصلتهم الرسالة:', value: `\`${successCount}\` شخص`, inline: true },
            { name: '❌ خاصهم مقفل:', value: `\`${failCount}\` شخص`, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp();

    return await statusMessage.edit({ content: '✅ **تم الانتهاء من الإرسال!**', embeds: [reportEmbed] });
}
