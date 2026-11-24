const http = require('http');
http.createServer((req, res) => { res.writeHead(200); res.end('HolyMolly online'); }).listen(process.env.PORT || 10000);

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const channelId = process.env.SPOTLIGHT_CHANNEL_ID;
const shareChannelId = '1537310207351463966';
const gtaPublishAt = Date.parse('2026-11-23T16:00:00Z');
let gtaPublishTimer;
let gtaPublished = false;
if (!token || !clientId || !guildId) process.exit(1);

const hm = new SlashCommandBuilder()
  .setName('hm')
  .setDescription('HolyMolly tools')
  .addSubcommand(s => s.setName('ping').setDescription('Check online'))
  .addSubcommand(s => s.setName('preview-coastal-card').setDescription('Private River Journey preview'))
  .addSubcommand(s => s.setName('preview-small-explorer').setDescription('Private small explorer preview'))
  .addSubcommand(s => s.setName('publish-river-journey').setDescription('Publish confirmed River Journey card'))
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

async function riverMessage(ephemeral) {
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
      '', '🎮 **Experience**',
      'Travel through the river landscape, explore the surroundings, and enjoy a peaceful journey across the water.',
      '', '🕹️ **Controls**',
      'WASD / Arrow Keys — Steer', 'Drag — Look around', 'Scroll — Zoom', 'E — Observe',
      '', '🔗 **Play now**', '[Open River Journey](' + gameUrl + ')'
    ].join('\n'))
    .setImage('attachment://river-journey.png')
    .setFooter({ text: 'Created with HolyMolly ✨' });
  return { content: '🌫️ **A tranquil journey awaits**', embeds: [embed], files: [file], ...(ephemeral ? { ephemeral: true } : {}) };
}

async function smallExplorerMessage() {
  const gameUrl = 'https://game-test.holymolly.ai/artifact/r/run_BBWbwwkE2KKr/index.html';
  const file = new AttachmentBuilder('./small-explorer-gameplay.jpg', { name: 'small-explorer-gameplay.jpg' });
  const embed = new EmbedBuilder()
    .setTitle('small explorer')
    .setURL(gameUrl)
    .setColor(0x6f7652)
    .setDescription([
      'Step into a grand forest through the eyes of a tiny mouse. Wander beneath giant leaves, climb over roots and rocks, and discover a little red-and-white plane waiting among the trees. Explore freely at your own pace — no enemies, no timer. 🍃',
      '', '🎮 **Experience**',
      'Roam through an oversized woodland, climb across the environment, and uncover small surprises hidden throughout the forest.',
      '', '🕹️ **Controls**',
      'WASD — Move', 'Shift — Run', 'Space — Jump', 'Drag / Arrow Keys — Look around', 'E — Interact',
      '', '🔗 **Play now**', '[Open small explorer](' + gameUrl + ')'
    ].join('\n'))
    .setImage('attachment://small-explorer-gameplay.jpg')
    .setFooter({ text: 'Created with HolyMolly ✨' });
  return { content: '🐭 **A tiny adventure begins**', embeds: [embed], files: [file], ephemeral: true };
}

async function xGtaMessage(ephemeral) {
  const postUrl = 'https://x.com/HolyMolly_AI/status/2123415748353970274';
  const imageUrl = 'https://raw.githubusercontent.com/xiaosherry193-crypto/holymolly-discord-bot/main/holy-molly-x-gta.webp';
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error('X preview image failed: ' + response.status);
  const file = new AttachmentBuilder(Buffer.from(await response.arrayBuffer()), { name: 'holy-molly-x-gta.webp' });
  const imageFrame = new EmbedBuilder().setColor(0x1d9bf0).setImage('attachment://holy-molly-x-gta.webp');
  const content = [
    '📣 **From HolyMolly on X**', '',
    '🚨 **How close can AI get to a real game world?**', '',
    'A HolyMolly creator brought a GTA-inspired city to life in 3D — complete with neon signs, police cars, flickering streetlights, and gritty street details. 🎮', '',
    'Looks familiar? Take a closer look. 👀', '',
    '🎬 **Watch the full post on X:** [Open the post](' + postUrl + ')',
    '💛 **Follow us on X:** [@HolyMolly_AI](https://x.com/HolyMolly_AI)',
    '🌍 **Create your own playable world:** [holymolly.ai](https://holymolly.ai)'
  ].join('\n');
  return { content, embeds: [imageFrame], files: [file], ...(ephemeral ? { ephemeral: true } : {}) };
}

async function publishScheduledGta() {
  if (gtaPublished) return;
  gtaPublished = true;
  try {
    const channel = await client.channels.fetch(shareChannelId);
    if (!channel || !channel.isTextBased()) throw new Error('Share channel unavailable');
    await channel.send(await xGtaMessage(false));
    console.log('Scheduled GTA X post published.');
  } catch (error) {
    gtaPublished = false;
    console.error('Scheduled GTA X post failed:', error);
    gtaPublishTimer = setTimeout(publishScheduledGta, 60000);
  }
}

function scheduleGtaPost() {
  const delay = gtaPublishAt - Date.now();
  if (delay <= 0) return publishScheduledGta();
  clearTimeout(gtaPublishTimer);
  gtaPublishTimer = setTimeout(publishScheduledGta, delay);
  console.log('GTA X post scheduled for ' + new Date(gtaPublishAt).toISOString());
}

(async () => {
  await new REST({ version: '10' }).setToken(token).put(Routes.applicationGuildCommands(clientId, guildId), { body: [hm] });
  await client.login(token);
})();

client.once('ready', () => {
  console.log('HolyMolly online as ' + client.user.tag);
  scheduleGtaPost();
});
client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand() || i.commandName !== 'hm') return;
  try {
    const s = i.options.getSubcommand();
    if (s === 'ping') return i.reply({ content: 'HolyMolly is online and ready.', ephemeral: true });
    if (s === 'preview-coastal-card') return i.reply(await riverMessage(true));
    if (s === 'preview-small-explorer') return i.reply(await smallExplorerMessage());
    if (s === 'publish-river-journey') {
      const c = await client.channels.fetch(channelId);
      if (!c || !c.isTextBased()) throw new Error('Spotlight channel unavailable');
      await c.send(await riverMessage(false));
      return i.reply({ content: 'River Journey published to creator-spotlight.', ephemeral: true });
    }
    if (s === 'preview-x-gta') return i.reply(await xGtaMessage(true));
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
