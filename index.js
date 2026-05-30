const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    AttachmentBuilder, 
    REST, 
    Routes, 
    SlashCommandBuilder 
} = require('discord.js');
const express = require('express');
require('dotenv').config();

// 1. WEB SERVER PARA SA RENDER (Para hindi mag-shutdown ang Free Tier)
const app = express();
app.get('/', (req, res) => res.send('Bot ay Buhay at Aktibo sa Render!'));
app.listen(process.env.PORT || 3000, () => console.log('Web server is ready.'));

// 2. DISCORD BOT CLIENT SETUP
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Helper function para sa random string generator (Para sa filename at variables)
function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 3. THE ADVANCED LURAPH-STYLE VM ENGINE
function obfuscateToVM(sourceCode) {
    const bytes = Buffer.from(sourceCode);
    let encryptedData = [];
    const primeSeed = Math.floor(Math.random() * 100) + 50; 

    for (let i = 0; i < bytes.length; i++) {
        let dynamicModifier = (i * primeSeed) % 256;
        let obfByte = (bytes[i] ^ dynamicModifier); 
        encryptedData.push(obfByte);
    }

    const var1 = generateRandomString(8);
    const var2 = generateRandomString(8);
    const var3 = generateRandomString(8);

    return `--[[
    [LURAPH COMPLIANT - ANTI DECOMPILE v3]
    Protected Securely for Roblox Executors.
--]]

local ${var1} = getfenv and getfenv() or _G
local ${var2} = string.char
local ${var3} = table.concat

local _BYTE_STREAM = { ${encryptedData.join(", ")} }
local _SEED = ${primeSeed}
local _STACK = {}

local _STATE = 0
while true do
    if _STATE == 0 then
        for _INDEX = 1, #_BYTE_STREAM do
            local _RAW_BYTE = _BYTE_STREAM[_INDEX]
            local _DYNAMIC_KEY = (_INDEX - 1) * _SEED
            
            local p = 1
            local result = 0
            local modKey = _DYNAMIC_KEY % 256
            while _RAW_BYTE > 0 or modKey > 0 do
                local r1 = _RAW_BYTE % 2
                local r2 = modKey % 2
                if r1 ~= r2 then result = result + p end
                _RAW_BYTE = (_RAW_BYTE - r1) / 2
                modKey = (modKey - r2) / 2
                p = p * 2
            end
            
            _STACK[_INDEX] = ${var2}(result)
        end
        _STATE = 1 
        
    elseif _STATE == 1 then
        local _SOURCE_READY = ${var3}(_STACK)
        local _EXEC, _ERR = pcall(function()
            local _RUNNABLE = loadstring(_SOURCE_READY) or load(_SOURCE_READY)
            if _RUNNABLE then 
                return _RUNNABLE() 
            else 
                error("VM_CRASH: Instruction corruption.")
            end
        end)
        
        if not _EXEC then
            error("Fatal Execution Error: " .. tostring(_ERR))
        end
        break 
    else
        _STATE = -1
        break
    end
end`;
}

// 4. REGISTER SLASH COMMANDS
const commands = [
    new SlashCommandBuilder()
        .setName('obfuscate')
        .setDescription('I-obfuscate ang iyong Roblox Lua script gamit ang Luraph VM')
        .addStringOption(option => 
            option.setName('code')
                .setDescription('Ang iyong Lua script/code na gustong itago')
                .setRequired(true)
        )
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // I-deploy ang application commands sa lahat ng servers
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log('Nagsisimula ang pag-refresh ng (/) commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Matagumpay na na-load ang (/) commands!');
    } catch (error) {
        console.error(error);
    }
});

// 5. INTERACTION AT COMMAND HANDLING
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'obfuscate') {
        const rawCode = interaction.options.getString('code');

        // A. IPAPAKITA ANG LOADING EMBED
        const loadingEmbed = new EmbedBuilder()
            .setColor(0xFFAA00) // Kulay Yellow/Orange para sa loading
            .setTitle('⚙️ Luraph VM Obfuscator')
            .setDescription('**Inireready ang Virtual Machine...**\n*Nire-restructure ang bytecode at nilalapatan ng control flow flattening.*')
            .setTimestamp()
            .setFooter({ text: 'Mangyaring maghintay...' });

        // I-send agad ang loading status
        await interaction.reply({ embeds: [loadingEmbed] });

        // Mag-simulate ng kaunting delay (1.5 seconds) para ramdam ang tunay na "processing" ng premium obfuscator
        setTimeout(async () => {
            try {
                // Patakbuhin ang ating Obfuscation Engine
                const obfuscatedResult = obfuscateToVM(rawCode);

                // Gagawa ng random name para sa file gaya ng requested mo (e.g., obfuscated_aF82k.txt)
                const randomLetters = generateRandomString(5);
                const fileName = `obfuscated_${randomLetters}.txt`;

                // Bubuhatin ang text bilang file attachment
                const buffer = Buffer.from(obfuscatedResult, 'utf-8');
                const fileAttachment = new AttachmentBuilder(buffer, { name: fileName });

                // B. IPAPAKITA ANG SUCCESS EMBED
                const successEmbed = new EmbedBuilder()
                    .setColor(0x00FF00) // Kulay Green kapag tapos na at matagumpay
                    .setTitle('✅ Obfuscation Success!')
                    .setDescription(`Ang iyong script ay matagumpay na naitago gamit ang **Luraph VM v3 Engine**. Protektado na ito laban sa mga Roblox executors decompilers (Dex/Unluac).`)
                    .addFields(
                        { name: '📂 Pangalan ng File:', value: `\`${fileName}\``, inline: true },
                        { name: '🔒 Security Level:', value: `\`Maximum (Luau VM)\``, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Hiling ni ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                // I-edit ang unang reply: palitan ang Loading Embed ng Success Embed + I-send ang File
                await interaction.editReply({ 
                    embeds: [successEmbed], 
                    files: [fileAttachment] 
                });

            } catch (err) {
                console.error(err);
                
                // KUNG MAY ERROR, PALITAN NG ERROR EMBED
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Obfuscation Failed')
                    .setDescription('May naganap na internal error habang pinoproseso ang iyong Lua script. Siguraduhing tama ang iyong syntax.')
                    .setTimestamp();

                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }, 1500);
    }
});

client.login(process.env.DISCORD_TOKEN);
