const http=require('http');
http.createServer((req,res)=>{res.writeHead(200);res.end('HolyMolly online');}).listen(process.env.PORT||10000);
const {Client,GatewayIntentBits,REST,Routes,SlashCommandBuilder,EmbedBuilder,PermissionFlagsBits}=require('discord.js');
const token=process.env.DISCORD_TOKEN, clientId=process.env.DISCORD_CLIENT_ID, guildId=process.env.DISCORD_GUILD_ID, channelId=process.env.SPOTLIGHT_CHANNEL_ID;
if(!token||!clientId||!guildId) process.exit(1);
const hm=new SlashCommandBuilder().setName('hm').setDescription('HolyMolly tools').addSubcommand(s=>s.setName('ping').setDescription('Check online')).addSubcommand(s=>s.setName('preview-coastal-card').setDescription('Private Coastal Card preview')).addSubcommand(s=>s.setName('publish').setDescription('Publish spotlight').addStringOption(o=>o.setName('title').setDescription('Title').setRequired(true)).addStringOption(o=>o.setName('url').setDescription('URL').setRequired(true)).addStringOption(o=>o.setName('image_url').setDescription('Screenshot URL'))).toJSON();
const client=new Client({intents:[GatewayIntentBits.Guilds]});
const embed=(title,url,image)=>{const e=new EmbedBuilder().setTitle(title).setURL(url).setDescription('Explore this HolyMolly creator spotlight piece.').setColor(0x7c5cff).setFooter({text:'HolyMolly Creator Spotlight'});if(image)e.setImage(image);return e};
(async()=>{await new REST({version:'10'}).setToken(token).put(Routes.applicationGuildCommands(clientId,guildId),{body:[hm]});await client.login(token)})();
client.once('ready',()=>console.log('HolyMolly online as '+client.user.tag));
client.on('interactionCreate',async i=>{if(!i.isChatInputCommand()||i.commandName!=='hm')return;try{const s=i.options.getSubcommand();if(s==='ping')return i.reply({content:'HolyMolly is online and ready.',ephemeral:true});if(s==='preview-coastal-card')return i.reply({content:'Private preview',embeds:[embed('River Journey','https://game.holymolly.ai/artifact/r/run_3BqFcxsE3atm/index.html?lang=en','https://image.thum.io/get/width/1280/crop/720/noanimate/https://game.holymolly.ai/artifact/r/run_3BqFcxsE3atm/index.html?lang=en')],ephemeral:true});if(s==='publish'){const c=await client.channels.fetch(channelId);await c.send({embeds:[embed(i.options.getString('title',true),i.options.getString('url',true),i.options.getString('image_url'))]});return i.reply({content:'Published to creator-spotlight.',ephemeral:true})}}catch(e){console.error(e);if(i.replied)i.followUp({content:'Action failed.',ephemeral:true});else i.reply({content:'Action failed.',ephemeral:true})}});



