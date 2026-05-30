const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`✅ Bot ay handa na! Naka-login bilang ${client.user.tag}`);

    // I-register ang slash command
    try {
        await client.application.commands.set([
            {
                name: 'obfuscate',
                description: 'I-obfuscate ang Lua code gamit ang Prometheus (Heavy)',
                options: [
                    {
                        name: 'code',
                        description: 'Ang Lua code na gusto mong i-obfuscate',
                        type: 3, // STRING
                        required: true
                    }
                ]
            }
        ]);
        console.log('✅ Slash command /obfuscate ay narehistro na!');
    } catch (error) {
        console.error('❌ Error sa pag-register ng command:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'obfuscate') return;

    const originalCode = interaction.options.getString('code');

    // 1. Loading embed
    const loadingEmbed = new EmbedBuilder()
        .setTitle('⏳ Obfuscating Code...')
        .setDescription('Ginagamit ang Prometheus CLI (Heavy preset). Sandali lang.')
        .setColor(0xFFA500);
    await interaction.reply({ embeds: [loadingEmbed] });

    const tempInputPath = path.join(__dirname, `temp_input_${Date.now()}.lua`);
    const tempOutputPath = path.join(__dirname, `temp_output_${Date.now()}.lua`);

    try {
        // 2. Isulat ang code sa temp file
        await fs.writeFile(tempInputPath, originalCode, 'utf-8');

        // 3. Patakbuhin ang Prometheus CLI
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

        // 4. Basahin ang obfuscated code
        const obfuscatedCode = await fs.readFile(tempOutputPath, 'utf-8');
        const fileName = `obfuscated_${Date.now()}.txt`;

        // 5. Success embed
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Obfuscation Complete!')
            .setDescription(`**Original length:** ${originalCode.length} chars\n**Obfuscated length:** ${obfuscatedCode.length} chars`)
            .setColor(0x00FF00)
            .setFooter({ text: 'Prometheus CLI (Heavy preset) - WeAreDevs.net style' });

        // 6. I-edit ang reply at isama ang file
        await interaction.editReply({
            embeds: [successEmbed],
            files: [{
                attachment: Buffer.from(obfuscatedCode, 'utf-8'),
                name: fileName
            }]
        });

    } catch (error) {
        console.error(error);
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Obfuscation Failed!')
            .setDescription('May mali sa code o sa Prometheus CLI. Pakisubukan ulit.')
            .setColor(0xFF0000);
        await interaction.editReply({ embeds: [errorEmbed] });
    } finally {
        // 7. Linisin ang temporary files
        await fs.unlink(tempInputPath).catch(() => {});
        await fs.unlink(tempOutputPath).catch(() => {});
    }
});

client.login(process.env.DISCORD_TOKEN);
