// @ts-nocheck
import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('إرسال رسالة جماعية في الخاص للأعضاء مع تقرير ذكي')
    .addStringOption(option => 
        option.setName('message')
            .setDescription('اكتب نص الرسالة الجماعية هنا')
            .setRequired(true)
    );

export async function execute(interaction: CommandInteraction) {
    if (!interaction.member.permissions.has('ManageGuild')) {
        return await interaction.reply({ content: '❌ هذا الأمر مخصص للإدارة فقط!', ephemeral: true });
    }

    const broadcastMessage = interaction.options.getString('message');
    
    const userEmbed = new EmbedBuilder()
        .setTitle(`📢 رسالة جماعية من سيرفر: ${interaction.guild.name}`)
        .setDescription(broadcastMessage)
        .setColor(0x00FFFF)
        .setTimestamp();

    await interaction.reply({ content: '🔄 جاري بدء الإرسال وإعداد التقرير التلقائي...', ephemeral: true });

    const members = await interaction.guild.members.fetch();
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

    if (reportText.length > 1800) {
        reportText = reportText.substring(0, 1800) + "\n... وتوجد أسماء أخرى بالأعلى";
    }

    const reportEmbed = new EmbedBuilder()
        .setTitle('📊 تقرير تسليم البرودكاست الشامل')
        .setDescription(`**حالة الإرسال لكل عضو:**\n\`\`\`text\n${reportText || "لا يوجد أعضاء"}\n\`\`\``)
        .addFields(
            { name: '🟢 تم الإرسال بنجاح:', value: `\`${successCount}\` عضو`, inline: true },
            { name: '🔴 فشل الإرسال (مقفل الخاص):', value: `\`${failCount}\` عضو`, inline: true }
        )
        .setColor(0x00FF00)
        .setTimestamp()
        .setFooter({ text: 'نظام إدارة سيرفر أسامة التلقائي 🛡️' });

    return await interaction.followUp({ embeds: [reportEmbed], ephemeral: true });
}
