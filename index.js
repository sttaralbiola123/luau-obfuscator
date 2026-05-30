const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
require('dotenv').config();

// 1. Web Server para manatiling online ang Render (Huwag buburahin)
const app = express();
app.get('/', (req, res) => res.send('Bot is active'));
app.listen(process.env.PORT || 3000);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- FLATTENING ENGINE ---
function flattenCode(script) {
  if (!script) throw new Error("Walang laman ang script!");
  
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
  console.log('Bot Online at ready!');
});

client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand()) return;
  
  try {
    const raw = i.options.getString('code');
    const output = flattenCode(raw);
    
    // Hahatiin natin ang output kung sobrang haba para hindi mag-error si Discord
    if (output.length > 1900) {
        await i.reply("Error: Masyadong mahaba ang script!");
    } else {
        await i.reply("```lua\n" + output + "\n```");
    }
  } catch(e) { 
    console.error(e);
    await i.reply("Error sa obfuscation: " + e.message); 
  }
});

client.login(process.env.DISCORD_TOKEN);
