const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- FLATTENING ENGINE ---
function flattenCode(script) {
  const lines = script.split('\n').filter(l => l.trim() !== "");
  let states = lines.map((code, i) => ({ id: 1000 + i * 17, code }));
  states.sort(() => Math.random() - 0.5);
  
  let out = `local state = ${states[0].id}\nwhile state ~= 0 do\n`;
  states.forEach((s, i) => {
    let next = (i === states.length - 1) ? 0 : states[i+1].id;
    out += `  ${i === 0 ? "if" : "elseif"} state == ${s.id} then\n    ${s.code}\n    state = ${next}\n`;
  });
  return out + `end`;
}

// --- COMMAND SETUP ---
const commands = [
  new SlashCommandBuilder()
    .setName('obfuscate')
    .setDescription('Flatten code')
    .addStringOption(o => o.setName('code').setDescription('Lua code').setRequired(true))
].map(c => c.toJSON());

client.on('ready', async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log('Bot Online!');
});

client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand()) return;
  const raw = i.options.getString('code');
  try {
    const output = flattenCode(raw);
    await i.reply({ content: "```lua\n" + output + "\n```" });
  } catch(e) { await i.reply("Error!"); }
});

client.login(process.env.DISCORD_TOKEN);
