// @ts-nocheck
import { REST, Routes, EmbedBuilder } from 'discord.js';

export const handleCommands = async (client) => {
    const commands = [
        { name: 'help', description: 'قائمة الأوامر' },
        { name: 'kick', description: 'طرد عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'سبب', type: 3, required: true }] },
        { name: 'ban', description: 'حظر عضو', options: [{ name: 'عضو', type: 6, required: true }, { name: 'سبب', type: 3, required: true }] },
        { name: 'report', description: 'تقديم بلاغ', options: [{ name: 'عضو', type: 6, required: true }, { name: 'السبب', type: 3, required: true }] }
    ];

    // تسجيل الأوامر
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });

    client.on('interactionCreate', async (i) => {
        if (!i.isChatInputCommand()) return;
        await i.deferReply({ ephemeral: true });
        
        // منطق تنفيذ الأوامر (هنا يمكنك إضافة مئات السطور لكل أمر)
        if (i.commandName === 'kick') {
            const member = i.options.getMember('عضو');
            await member.kick(i.options.getString('سبب'));
            await i.editReply(`🔨 تم طرد ${member.user.tag}`);
        }
        // ... (تستمر بإضافة باقي الأوامر هنا)
    });
};
