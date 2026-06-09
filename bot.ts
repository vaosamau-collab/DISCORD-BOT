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

const TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`✅ البوت جاهز ومستقر بدون نظام التيكت: ${client.user.tag}`);
    client.user.setActivity('حماية سيرفر أسامة | !help 🛡️');
});

client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    // --- 1. نظام الفلتر الذكي وسجل المخالفات ---
    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        
        // إرسال لوق لروم الـ Logs الخاص بك
        const logChannel = m.guild.channels.cache.get("1508091945883275495");
        if (logChannel) {
            logChannel.send(`🚨 **مخالفة جديدة**\nالمخالف: ${m.author.tag}\nالرسالة: ${m.content}`);
        }
        return;
    }

    // --- 2. التحقق من البادئة ---
    if (!m.content.startsWith('!')) return;
    const args = m.content.slice(1).split(/ +/);
    const cmd = args.shift().toLowerCase();

    // --- 3. قائمة الأوامر المتبقية ---
    
    // أمر فحص السرعة
    if (cmd === 'ping') {
        m.reply(`البوت يعمل بكامل طاقته! 🚀 (البينج: ${client.ws.ping}ms)`);
    }

    // أمر مسح الشات
    if (cmd === 'clear') {
        const amount = parseInt(args[0]) || 1;
        if (amount > 10000 || amount < 1) return m.reply("❌ حدد رقماً بين 1 و 100 للمسح.");
        await m.channel.bulkDelete(amount, true).catch(() => {});
        m.channel.send(`🧹 تم مسح ${amount} رسالة بنجاح.`).then(msg => setTimeout(() => msg.delete(), 3000));
    }

    // أمر الطرد (Kick)
    if (cmd === 'kick') {
        const member = m.mentions.members.first();
        if (!member) return m.reply("❌ يجب عليك منشنة العضو المراد طرده.");
        await member.kick().then(() => m.reply(`✅ تم طرد ${member.user.tag} من السيرفر.`)).catch(() => m.reply("❌ لا أملك صلاحية لطرد هذا العضو."));
    }

    // أمر الحظر (Ban)
    if (cmd === 'ban') {
        const member = m.mentions.members.first();
        if (!member) return m.reply("❌ يجب عليك منشنة العضو المراد حظره.");
        await member.ban().then(() => m.reply(`🔨 تم حظر ${member.user.tag} نهائياً.`)).catch(() => m.reply("❌ لا أملك صلاحية لحظر هذا العضو."));
    }

    // أمر المساعدة وعرض الأوامر (Help)
    if (cmd === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("🛡️ لوحة تحكم سيرفر أسامة")
            .setDescription("إليك قائمة بالأوامر المتاحة بعد إزالة التيكت:")
            .addFields(
                { name: "⚙️ أوامر الإدارة", value: "`!clear [العدد]` - لتنظيف الشات\n`!kick @عضو` - لطرد عضو\n`!ban @عضو` - لحظر عضو", inline: false },
                { name: "📡 أوامر عامة", value: "`!ping` - لفحص سرعة استجابة البوت", inline: false }
            )
            .setColor(0xFF0000)
            .setFooter({ text: "نظام حماية وإدارة تلقائي" });

        m.reply({ embeds: [embed] });
    }
});

client.login(TOKEN);
