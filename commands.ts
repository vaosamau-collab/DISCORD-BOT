// @ts-nocheck
import { REST, Routes, EmbedBuilder } from 'discord.js';
import * as fs from 'fs';

export const handleCommands = async (client) => {
    const commands = [
        { name: 'kick', description: 'طرد عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'سبب', type: 3, required: true }] },
        { name: 'ban', description: 'حظر عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'سبب', type: 3, required: true }] },
        { name: 'report', description: 'إبلاغ عن عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'السبب', type: 3, required: true }] }
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID || "1507868881597759510"), { body: commands });

    client.on('interactionCreate', async (i) => {
        if (!i.isChatInputCommand()) return;
        await i.deferReply({ ephemeral: true });

        try {
            if (i.commandName === 'kick') {
                const member = i.options.getMember('عضو');
                const reason = i.options.getString('سبب');
                await member.kick(reason);
                await i.editReply(`🔨 تم تنفيذ أمر الطرد بحق: ${member.user.tag}`);
            }
            
            if (i.commandName === 'report') {
                const member = i.options.getMember('عضو');
                const reason = i.options.getString('السبب');
                const channel = client.channels.cache.get(client.config.reportChannel);
                
                const embed = new EmbedBuilder()
                    .setTitle("📢 بلاغ إداري جديد")
                    .setColor(0xFFFF00)
                    .addFields(
                        { name: "العضو المُبلّغ عنه", value: `${member.user.tag}`, inline: true },
                        { name: "المُبلّغ", value: `${i.user.tag}`, inline: true },
                        { name: "السبب", value: reason }
                    );
                await channel.send({ embeds: [embed] });
                await i.editReply("✅ تم إرسال البلاغ للإدارة بنجاح.");
            }
        } catch (e) {
            await i.editReply("❌ حدث خطأ أثناء تنفيذ الأمر. تأكد من صلاحيات البوت.");
        }
    });
};
