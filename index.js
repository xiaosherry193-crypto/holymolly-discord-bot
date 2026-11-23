const http = require('http');
http.createServer((req, res) => { res.writeHead(200); res.end('HolyMolly online'); }).listen(process.env.PORT || 10000);

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const channelId = process.env.SPOTLIGHT_CHANNEL_ID;
if (!token || !clientId || !guildId) process.exit(1);

const hm = new SlashCommandBuilder()
  .setName('hm')
  .setDescription('HolyMolly tools')
  .addSubcommand(s => s.setName('ping').setDescription('Check online'))
  .addSubcommand(s => s.setName('preview-coastal-card').setDescription('Private River Journey preview'))
  .addSubcommand(s => s.setName('preview-x-gta').setDescription('Private HolyMolly X post preview'))
  .addSubcommand(s => s.setName('publish').setDescription('Publish spotlight')
    .addStringOption(o => o.setName('title').setDescription('Title').setRequired(true))
    .addStringOption(o => o.setName('url').setDescription('URL').setRequired(true))
    .addStringOption(o => o.setName('image_url').setDescription('Screenshot URL')))
  .toJSON();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const basicEmbed = (title, url, image) => {
  const e = new EmbedBuilder().setTitle(title).setURL(url).setDescription('Explore this HolyMolly creator spotlight piece.').setColor(0x7c5cff).setFooter({ text: 'HolyMolly Creator Spotlight' });
  if (image) e.setImage(image);
  return e;
};

async function riverPreview() {
  const gameUrl = 'https://game.holymolly.ai/artifact/r/run_3BqFcxsE3atm/index.html?lang=en';
  const screenshotUrl = 'https://raw.githubusercontent.com/xiaosherry193-crypto/holymolly-discord-bot/main/river-journey-gameplay.png';
  const response = await fetch(screenshotUrl);
  if (!response.ok) throw new Error('Screenshot request failed: ' + response.status);
  const file = new AttachmentBuilder(Buffer.from(await response.arrayBuffer()), { name: 'river-journey.png' });
  const embed = new EmbedBuilder()
    .setTitle('River Journey')
    .setURL(gameUrl)
    .setColor(0x6f8178)
    .setDescription([
      'Set out across a serene world of winding rivers, misty mountains, and ancient stone statues. Discover quiet waterways and take in the landscape as the journey unfolds. 🛶',
      '',
      '🎮 **Experience**',
      'Travel through the river landscape, explore the surroundings, and enjoy a peaceful journey across the water.',
      '',
      '🕹️ **Controls**',
      'WASD / Arrow Keys — Steer',
      'Drag — Look around',
      'Scroll — Zoom',
      'E — Observe',
      '',
      '🔗 **Play now**',
      '[Open River Journey](' + gameUrl + ')'
    ].join('\n'))
    .setImage('attachment://river-journey.png')
    .setFooter({ text: 'Created with HolyMolly ✨' });
  return { content: '🌫️ **A tranquil journey awaits**', embeds: [embed], files: [file], ephemeral: true };
}

async function xGtaPreview() {
  const postUrl = 'https://x.com/HolyMolly_AI/status/2123415748353970274';
  const imageUrl = 'https://raw.githubusercontent.com/xiaosherry193-crypto/holymolly-discord-bot/main/holy-molly-x-gta.webp';
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error('X preview image failed: ' + response.status);
  const file = new AttachmentBuilder(Buffer.from(await response.arrayBuffer()), { name: 'holy-molly-x-gta.webp' });
  const embed = new EmbedBuilder()
    .setColor(0x1d9bf0)
    .setDescription([
      '🚨 **How close can AI get to a real game world?**',
      '',
      'A HolyMolly creator brought a GTA-inspired city to life in 3D — complete with neon signs, police cars, flickering streetlights, and gritty street details. 🎮',
      '',
      'Looks familiar? Take a closer look. 👀',
      '',
      '🎬 **Watch the full post on X:** [Open the post](' + postUrl + ')',
      '💛 **Follow us on X:** [@HolyMolly_AI](https://x.com/HolyMolly_AI)',
      '🌍 **Create your own playable world:** [holymolly.ai](https://holymolly.ai)'
    ].join('\n'))
    .setImage('attachment://holy-molly-x-gta.webp');
  return { content: '📣 **From HolyMolly on X**', embeds: [embed], files: [file], ephemeral: true };
}

(async () => {
  await new REST({ version: '10' }).setToken(token).put(Routes.applicationGuildCommands(clientId, guildId), { body: [hm] });
  await client.login(token);
})();

client.once('ready', () => console.log('HolyMolly online as ' + client.user.tag));
client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand() || i.commandName !== 'hm') return;
  try {
    const s = i.options.getSubcommand();
    if (s === 'ping') return i.reply({ content: 'HolyMolly is online and ready.', ephemeral: true });
    if (s === 'preview-coastal-card') return i.reply(await riverPreview());
    if (s === 'preview-x-gta') return i.reply(await xGtaPreview());
    if (s === 'publish') {
      const c = await client.channels.fetch(channelId);
      await c.send({ embeds: [basicEmbed(i.options.getString('title', true), i.options.getString('url', true), i.options.getString('image_url'))] });
      return i.reply({ content: 'Published to creator-spotlight.', ephemeral: true });
    }
  } catch (e) {
    console.error(e);
    const r = { content: 'Action failed.', ephemeral: true };
    if (i.replied || i.deferred) await i.followUp(r); else await i.reply(r);
  }
});
