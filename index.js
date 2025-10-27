import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';

// === CONFIG ===
const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.BROADCAST_CHANNEL_ID;
const CRON_EXPRESSION = process.env.CRON_EXPRESSION || '*/15 * * * *'; // cada 15 min por defecto

// === MENSAJES ===
const MESSAGES = [
  "¡Vamos equipos! Un paso más y la flag os sonríe. 👀",
  "Blindbot: la sanitización odia las comillas… ¿y si no las usáis? 🧠",
  "Si UNION falla, pensad en timing o boolean-based. ⏱️",
  "Ups, vuestra inyección ha quedado en cuarentena. 🤖",
  "Intento registrado. ¿Quién será el siguiente? 💀",
  "Blindbot supervisa... y se ríe bajito. 😈"
];

// === BOT ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds] // no necesitamos leer mensajes
});

client.once('ready', async () => {
  console.log(`✅ Conectado como ${client.user.tag}`);

  // Confirmamos el canal
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) {
    console.error('❌ No encuentro el canal. Revisa BROADCAST_CHANNEL_ID');
    process.exit(1);
  }

  // Mensaje de arranque
  await channel.send("🤖 Blindbot online. Preparad vuestras payloads. 🧪");

  // === CRON JOB ===
  cron.schedule(CRON_EXPRESSION, async () => {
    try {
      const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      await channel.send(msg);
      console.log(`[${new Date().toISOString()}] Mensaje enviado: ${msg}`);
    } catch (e) {
      console.error('❌ Error enviando mensaje:', e);
    }
  });

  console.log(`🕒 Cron programado: ${CRON_EXPRESSION}`);
});

client.login(TOKEN);
