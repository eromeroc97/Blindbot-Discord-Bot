import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';
import fs from 'node:fs';
import http from 'node:http';

// === TIMEZONE ===
process.env.TZ = 'Europe/Madrid';
console.log('🕒 Timezone configurado a Europe/Madrid');

console.log('🚀 Iniciando Blindbot...');
console.log('📋 Cargando configuración desde .env...');

// === CONFIG ===
const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.BROADCAST_CHANNEL_ID;
const ROLE_ID = process.env.ROLE_ID;
const CRON_EXPRESSION = process.env.CRON_EXPRESSION || '*/20 9-15 * * *'; // cada 20 min de 9:00 a 15:00

console.log(`🔑 TOKEN: ${TOKEN ? 'Cargado' : 'Falta configurar DISCORD_TOKEN'}`);
console.log(`📺 CHANNEL_ID: ${CHANNEL_ID}`);
console.log(`👥 ROLE_ID: ${ROLE_ID}`);
console.log(`⏰ CRON_EXPRESSION: ${CRON_EXPRESSION}`);

// === MENSAJES ===
console.log('📄 Cargando mensajes desde messages.json...');
const messagesData = JSON.parse(fs.readFileSync('./messages.json', 'utf8'));
const MESSAGES = messagesData.messages;
let messageIndex = 0;
let finalMessageSent = false;

console.log(`📝 Total de mensajes cargados: ${MESSAGES.length}`);
console.log('Mensajes:', MESSAGES);

// === BOT ===
console.log('🤖 Creando cliente de Discord...');
const client = new Client({
  intents: [GatewayIntentBits.Guilds] // no necesitamos leer mensajes
});

client.once('clientReady', async () => {
  console.log(`✅ Conectado como ${client.user.tag} (ID: ${client.user.id})`);
  console.log(`🌐 Servidores: ${client.guilds.cache.size}`);
  console.log(`⏳ Hora de conexión: ${new Date().toISOString()}`);

  console.log(`🔍 Buscando canal con ID: ${CHANNEL_ID}...`);
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) {
    console.error('❌ No encuentro el canal. Revisa BROADCAST_CHANNEL_ID');
    const channelsList = client.channels.cache.map(c => `${c.id}: ${c.name}`).join(', ');
    console.error(`🔍 Canales disponibles: ${channelsList}`);
    process.exit(1);
  }
  console.log(`✅ Canal encontrado: ${channel.name} (ID: ${channel.id})`);

  console.log(`📢 Enviando mensaje inicial con mención al rol ${ROLE_ID}...`);
  // Mensaje inicial con mención al rol
  await channel.send({
    content: `🤖 Blindbot online. Preparad vuestras payloads. <@&${ROLE_ID}> 🧪`,
    allowedMentions: { roles: [ROLE_ID] } // 👈 esto permite mencionar el rol
  });
  console.log('✅ Mensaje inicial enviado.');

  console.log(`🕒 Programando cron: ${CRON_EXPRESSION}`);
  cron.schedule(CRON_EXPRESSION, async () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    console.log(`⏰ Cron ejecutado: ${now.toISOString()} (Hora: ${hour}:${minute.toString().padStart(2, '0')})`);

    let shouldSend = false;
    let isFinalMessage = false;

    if (hour >= 15 && !finalMessageSent) {
      shouldSend = true;
      isFinalMessage = true;
      console.log('🎉 Enviando mensaje final (hora >= 15:00 y no enviado hoy).');
    } else if (hour >= 9 && hour < 15 && minute % 20 === 0) {
      shouldSend = true;
      console.log('✅ Horario válido para mensaje regular.');
    } else {
      console.log('⏸️ No es momento para enviar mensaje.');
    }

    if (shouldSend) {
      try {
        const timeStr = `${hour}:${minute.toString().padStart(2, '0')}`;
        let prefix = '';
        let msg = '';

        if (isFinalMessage) {
          msg = "¡Fin de la Hack&Win 2025! ¡Feliz Halloween!";
          prefix = `[Son las ${timeStr}]`; // Sin "quedan x minutos" para el final
          finalMessageSent = true;
        } else {
          // Calcular minutos restantes hasta 15:00
          const endTime = new Date(now);
          endTime.setHours(15, 0, 0, 0);
          const remainingMinutes = Math.max(0, Math.floor((endTime - now) / 60000));

          prefix = `[Son las ${timeStr} quedan ${remainingMinutes} minutos]`;
          msg = MESSAGES[messageIndex];
          console.log(`📝 Usando mensaje índice ${messageIndex}: "${msg}"`);
          messageIndex = (messageIndex + 1) % MESSAGES.length;
          console.log(`🔄 Próximo índice: ${messageIndex}`);
        }

        const fullMessage = `<@&${ROLE_ID}> ${prefix} ${msg}`;
        console.log(`📤 Enviando mensaje completo: "${fullMessage}"`);

        // Añadimos la mención del rol a cada mensaje
        await channel.send({
          content: fullMessage,
          allowedMentions: { roles: [ROLE_ID] }
        });

        const extraInfo = isFinalMessage ? 'Mensaje final enviado.' : `Índice usado: ${messageIndex - 1}`;
        console.log(`✅ Mensaje enviado exitosamente a las ${timeStr}. ${extraInfo}`);
      } catch (e) {
        console.error('❌ Error enviando mensaje:', e);
        console.error('Stack trace:', e.stack);
      }
    }
  });

  console.log(`🕒 Mensajes programados cada 20 min de 9:00 a 15:00`);

  // === RESET DIARIO ===
  cron.schedule('0 0 * * *', () => {
    messageIndex = 0;
    finalMessageSent = false;
    console.log('🔄 Mensajes y flag de mensaje final reseteados a las 00:00 - Listos para el próximo día');
  });
});

console.log('🔐 Intentando login con Discord...');
client.login(TOKEN);

// === SERVIDOR WEB ===
console.log('🌐 Iniciando servidor web...');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    console.log('🏥 Health check solicitado');
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Blindbot - Feliz Halloween</title>
        <style>
          body {
            background: linear-gradient(135deg, #000 0%, #2F1B14 50%, #000 100%);
            color: #FFA500;
            font-family: 'Arial', sans-serif;
            text-align: center;
            padding: 50px;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
          }
          body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text fill="%23FF4500" font-size="20" y="50%">🎃👻🦇</text></svg>') repeat;
            opacity: 0.1;
            z-index: -1;
          }
          h1 {
            font-size: 4em;
            text-shadow: 3px 3px #FF4500, 6px 6px #8B0000;
            margin-bottom: 20px;
            animation: glow 2s ease-in-out infinite alternate;
          }
          @keyframes glow {
            from { text-shadow: 3px 3px #FF4500, 6px 6px #8B0000; }
            to { text-shadow: 3px 3px #FF4500, 6px 6px #8B0000, 0 0 20px #FFA500; }
          }
          p {
            font-size: 1.5em;
            margin: 20px 0;
            text-shadow: 1px 1px #8B0000;
          }
          .pumpkin {
            font-size: 5em;
            margin: 30px 0;
            animation: bounce 3s infinite;
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          .footer {
            position: absolute;
            bottom: 20px;
            font-size: 1em;
            opacity: 0.7;
          }
        </style>
      </head>
      <body>
        <h1>🎃 Feliz Halloween 🎃</h1>
        <p>Blindbot está activo y listo para la Hack&Win 2025!</p>
        <div class="pumpkin">🦇👻🕷️</div>
        <p class="footer">¡Preparad vuestras payloads! 🧪</p>
      </body>
      </html>
    `);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Servidor web corriendo en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT} (o la URL de Render)`);
});
