const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Ang token ng iyong Discord bot (ilalagay sa Render bilang environment variable)
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`✅ Bot ay handa na! Naka-login bilang ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Huwag pansinin ang mga mensahe ng ibang bot
    if (message.author.bot) return;

    // Tingnan kung may attachment
    if (message.attachments.size > 0) {
        const attachment = message.attachments.first();

        // Siguraduhing .lua file ang attachment
        if (attachment.name && attachment.name.endsWith('.lua')) {
            const statusMsg = await message.reply('⏳ **Obfuscating iyong Lua code...** Sandali lang.');

            // Mga pangalan ng temporary files
            const tempInputPath = path.join(__dirname, `temp_input_${Date.now()}.lua`);
            const tempOutputPath = path.join(__dirname, `temp_output_${Date.now()}.lua`);

            try {
                // 1. I-download ang Lua file
                const response = await fetch(attachment.url);
                const luaCode = await response.text();
                await fs.writeFile(tempInputPath, luaCode, 'utf-8');

                // 2. Tawagin ang Prometheus CLI para mag-obfuscate
                //    Ang '--preset Heavy' ay para sa maximum na proteksyon
                await new Promise((resolve, reject) => {
                    exec(`npx @gamely/prometheus-cli ${tempInputPath} --preset Heavy -o ${tempOutputPath}`,
                        (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Prometheus Error: ${error.message}`);
                                return reject(error);
                            }
                            resolve();
                    });
                });

                // 3. Basahin ang na-obfuscate na code
                const obfuscatedCode = await fs.readFile(tempOutputPath, 'utf-8');

                // 4. Ipadala ito pabalik sa Discord
                await message.reply({
                    content: '✅ **Tapos na!** Narito ang iyong na-obfuscate na Lua code:',
                    files: [{
                        attachment: Buffer.from(obfuscatedCode, 'utf-8'),
                        name: `obfuscated_${attachment.name}`
                    }]
                });

                // 5. Buksan ang loading status message
                await statusMsg.delete();

            } catch (error) {
                console.error(error);
                await statusMsg.edit('❌ **May error!** Hindi ko na-obfuscate ang code. Paki-check kung valid ang Lua code mo.');
            } finally {
                // 6. Linisin ang mga temporary files
                await fs.unlink(tempInputPath).catch(() => {});
                await fs.unlink(tempOutputPath).catch(() => {});
            }
        }
    }

    // Simpleng ping command para malaman kung gumagana ang bot
    if (message.content.toLowerCase() === '!ping') {
        await message.reply(`🏓 Pong! Ang latency ay ${Date.now() - message.createdTimestamp}ms.`);
    }
});

client.login(DISCORD_TOKEN);
