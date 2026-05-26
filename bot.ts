// @ts-nocheck
import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1507868881597759510";

const IDS = { SPAM_LOGS: "1508091945883275495" };

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] 
});

client.once('ready', async (c) => {
    // 1. تسجيل السلاش كومانز (مع وصف إجباري لمنع الكراش)
    const commands = [
        new SlashCommandBuilder().setName('help').setDescription('قائمة المساعدة'),
        new SlashCommandBuilder().setName('kick').setDescription('طرد عضو').addUserOption(o => o.setName('target').setDescription('العضو').setRequired(true))
    ];
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("✅ البوت يعمل بنظامين (Slash + !)");
});

// 2. نظام السلاش (Slash Commands)
client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;
    if (i.commandName === 'help') await i.reply({ content: "الأوامر: !help, !kick [mention], !ban [mention]", ephemeral: true });
});

// 3. نظام البادئة (Prefix Commands - الأوامر العادية)
client.on('messageCreate', async (m) => {
    if (m.author.bot) return;

    // الفلتر الجنائي (السب)
    const badWords = ["زق", "كلب", "خرا"];
    if (badWords.some(w => m.content.toLowerCase().includes(w))) {
        await m.delete().catch(() => {});
        const ch = m.guild.channels.cache.get(IDS.SPAM_LOGS);
        ch?.send(`🚨 مخالفة من ${m.author.tag}: ${m.content}`);
    }

    // نظام الأوامر بالبادئة (!)
    if (!m.content.startsWith('!')) return;
    const args = m.content.slice(1).split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle("📜 قائمة الأوامر")
            .setDescription("1. `!help` : عرض الأوامر\n2. `!kick @user` : طرد عضو\n3. `!ban @user` : حظر عضو")
            .setColor(0x00FF00);
        m.reply({ embeds: [embed] });
    } 
    else if (command === 'kick') {
        const member = m.mentions.members.first();
        if (member) {
            await member.kick().catch(() => m.reply("❌ لا أملك صلاحية طرده"));
            m.reply(`✅ تم طرد ${member.user.tag}`);
        }
    }
});

client.login(TOKEN);
