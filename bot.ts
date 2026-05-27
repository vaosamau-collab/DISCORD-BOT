// @ts-nocheck
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

const CONFIG = {
    LOG_CHANNEL: "1508091945883275495",
    WELCOME_CHANNEL: "1508087523820310578"
};

client.once('ready', () => {
    console.log(`✅ النظام الأمني العملاق يعمل: ${client.user.tag}`);
    client.user.setActivity('حماية سيرفر أسامة | !help', { type: 'WATCHING' });
});

client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    // 1. الفلتر الجنائي (مطور)
    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        m.channel.send(`⚠️ تم حذف رسالة مخالفة من ${m.author}`).then(msg => setTimeout(() => msg.delete(), 3000));
        const log = m.guild.channels.cache.get(CONFIG.LOG_CHANNEL);
        log?.send(`🚨 **مخالفة جديدة**\nالمخالف: ${m.author.tag}\nالرسالة: ${m.content}`);
    }

    if (!m.content.startsWith('!')) return;
    const args = m.content.slice(1).split(/ +/);
    const cmd = args.shift().toLowerCase();

    // 2. أوامر الإدارة (مطورة)
    if (cmd === 'kick') {
        const target = m.mentions.members.first();
        if (!target) return m.reply("❌ حدد العضو!");
        await target.kick().then(() => m.reply(`✅ تم طرد ${target.user.tag}`)).catch(() => m.reply("❌ خطأ: تأكد من صلاحياتي"));
    }
    
    if (cmd === 'ban') {
        const target = m.mentions.members.first();
        if (!target) return m.reply("❌ حدد العضو!");
        await target.ban().then(() => m.reply(`✅ تم حظر ${target.user.tag}`)).catch(() => m.reply("❌ خطأ: تأكد من صلاحياتي"));
    }

    if (cmd === 'clear') {
        const amount = parseInt(args[0]);
        if (!amount || amount > 100) return m.reply("❌ حدد رقم (1-100)");
        await m.channel.bulkDelete(amount, true);
        m.reply(`🧹 تم تنظيف ${amount} رسالة`).then(msg => setTimeout(() => msg.delete(), 3000));
    }

    // 3. أوامر المعلومات (جديد وضخم)
    if (cmd === 'userinfo') {
        const target = m.mentions.members.first() || m.member;
        const embed = new EmbedBuilder()
            .setTitle(`👤 معلومات العضو: ${target.user.username}`)
            .addFields(
                { name: "تاريخ الانضمام", value: target.joinedAt.toDateString() },
                { name: "الآيدي", value: target.id }
            ).setColor(0x00AAFF);
        m.reply({ embeds: [embed] });
    }

    if (cmd === 'serverinfo') {
        const embed = new EmbedBuilder()
            .setTitle(`🏠 سيرفر: ${m.guild.name}`)
            .addFields(
                { name: "عدد الأعضاء", value: `${m.guild.memberCount}`, inline: true },
                { name: "صاحب السيرفر", value: `<@${m.guild.ownerId}>`, inline: true }
            ).setColor(0xFFFF00);
        m.reply({ embeds: [embed] });
    }

    if (cmd === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("🛡️ مركز التحكم - نظام أسامة الضخم")
            .setDescription("الأوامر المتاحة:")
            .addFields(
                { name: "🔨 الإدارة", value: "`!kick`, `!ban`, `!clear`" },
                { name: "ℹ️ المعلومات", value: "`!userinfo`, `!serverinfo`" }
            ).setColor(0x00FF00);
        m.reply({ embeds: [embed] });
    }
});

client.on('guildMemberAdd', (member) => {
    const welcome = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL);
    welcome?.send(`👋 أهلاً بك يا ${member} في سيرفر أسامة! نورتنا.`);
});

client.login(process.env.DISCORD_TOKEN);
