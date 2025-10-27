import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';
import fs from 'node:fs';

// === CONFIG ===
const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.BROADCAST_CHANNEL_ID;
const ROLE_ID = process.env.ROLE_ID;
const CRON_EXPRESSION = process.env.CRON_EXPRESSION || '*/15 * * * *'; // cada 15 min por defecto

// === MENSAJES ===
const messagesData = JSON.parse(fs.readFileSync('./messages.json', 'utf8'));
const MESSAGES = messagesData.messages;

// === BOT ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds] // no necesitamos leer mensajes
});

client.once('ready', async () => {
  console.log(`✅ Conectado como ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) {
    console.error('❌ No encuentro el canal. Revisa BROADCAST_CHANNEL_ID');
    process.exit(1);
  }

  // Mensaje inicial con mención al rol
  await channel.send({
    content: `🤖 Blindbot online. Preparad vuestras payloads. <@&${ROLE_ID}> 🧪`,
    allowedMentions: { roles: [ROLE_ID] } // 👈 esto permite mencionar el rol
  });

  cron.schedule(CRON_EXPRESSION, async () => {
    try {
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

      // Añadimos la mención del rol a cada mensaje
      await channel.send({
        content: `<@&${ROLE_ID}> ${msg}`,
        allowedMentions: { roles: [ROLE_ID] }
      });

      console.log(`[${new Date().toISOString()}] Mensaje enviado: ${msg}`);
    } catch (e) {
      console.error('❌ Error enviando mensaje:', e);
    }
  });

  console.log(`🕒 Cron programado: ${CRON_EXPRESSION}`);
});

client.login(TOKEN);
