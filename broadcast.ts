// @ts-nocheck
import { EmbedBuilder, Message } from 'discord.js';

export async function execute(message: Message, args: string[]) {
    if (!message.member.permissions.has('ManageGuild')) {
        return await message.reply('❌ **[نظام الحظر !]:** هيه أنت! تبي تسوي برودكاست بدون صلاحية؟ ارجع ورا لا أبندك!');
    }

    const broadcastMessage = args.join(' ');
    if (!broadcastMessage) {
        return await message.reply('❌ **[البريفكس -]:** يا بطل اكتب نص الرسالة عشان نهز فيها السيرفر! مثال: `-broadcast المقطع نزل`');
    }
    
    const userEmbed = new EmbedBuilder()
        .setTitle(`📢 رسالة جماعية من سيرفر: ${message.guild.name}`)
        .setDescription(broadcastMessage)
        .setColor(0x00FFFF)
        .setTimestamp();

    // بداية الحرب الكلامية في الشات
    const statusMessage = await message.reply('🔄 **[البريفكس -]:** جاري تفعيل موجات البرودكاست واختراق الخاص.. (العلامة ! قاعدة تراقبنا ومو عاجبها الوضع) 🤫');

    const members = await message.guild.members.fetch();
    let successCount = 0;
    let failCount = 0;
    let reportText = ""; 

    for (const [id, member] of members) {
        if (member.user.bot) continue; 

        try {
            await member.send({ embeds: [userEmbed] });
            successCount++;
            reportText += `✅ ${member.user.username}\n`;
        } catch (err) {
            failCount++;
            reportText += `❌ ${member.user.username}\n`;
        }
    }

    if (reportText.length > 1500) {
        reportText = reportText.substring(0, 1500) + "\n... اللستة طويلة وما نبي زحمة";
    }

    // إمبيد التقرير الخصمي المشترك
    const reportEmbed = new EmbedBuilder()
        .setTitle('⚔️ ساحة معركة البرودكاست والتقارير')
        .setDescription(`**قائمة التسليم الحية:**\n\`\`\`text\n${reportText || "الشات فاضي"}\n\`\`\``)
        .addFields(
            { name: '🟢 جبهة الـ ( - ): وصلنا للناجحين', value: `\`${successCount}\` عضو استلم الخاص`, inline: true },
            { name: '🔴 جبهة الـ ( ! ): كشفنا المقفلين', value: `\`${failCount}\` عضو متبند خاصه`, inline: true },
            { name: '🎤 ديس وقصف جبهة بين الخصوم:', value: `**البريفكس (-):** شفت كيف؟ نشرت الإعلان للكل وفجرت الخاص، أنت حدك تمسح شات وتبند مساكين!\n\n**البريفكس (!):** ابلع العافية بس، لو ما حميت لك السيرفر من السبام كان بوتك هكروا فيه الصغار، قال برودكاست قال! 🤐`, inline: false }
        )
        .setColor(0xFF00FF)
        .setTimestamp()
        .setFooter({ text: 'صراع القوة والسيطرة في خوادم أسامة 💥' });

    return await statusMessage.edit({ content: '🏁 **انتهت الغارة الجماعية بنجاح!**', embeds: [reportEmbed] });
}
