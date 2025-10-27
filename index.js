import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';
import fs from 'node:fs';

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

console.log(`📝 Total de mensajes cargados: ${MESSAGES.length}`);
console.log('Mensajes:', MESSAGES);

// === BOT ===
console.log('🤖 Creando cliente de Discord...');
const client = new Client({
  intents: [GatewayIntentBits.Guilds] // no necesitamos leer mensajes
});

client.once('ready', async () => {
  console.log(`✅ Conectado como ${client.user.tag} (ID: ${client.user.id})`);
  console.log(`🌐 Servidores: ${client.guilds.cache.size}`);
  console.log(`⏳ Hora de conexión: ${new Date().toISOString()}`);

  console.log(`🔍 Buscando canal con ID: ${CHANNEL_ID}...`);
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) {
    console.error('❌ No encuentro el canal. Revisa BROADCAST_CHANNEL_ID');
    console.error(`🔍 Canales disponibles: ${client.channels.cache.map(c => `${c.id}: ${c.name}`).join(', ')}`);
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

    // Solo enviar si está entre 9:00 y 15:00
    if (hour >= 9 && hour <= 15 && minute % 20 === 0) {
      console.log('✅ Horario válido para envío.');
      try {
        // Calcular minutos restantes hasta 15:00
        const endTime = new Date(now);
        endTime.setHours(15, 0, 0, 0);
        const remainingMinutes = Math.max(0, Math.floor((endTime - now) / 60000));

        const timeStr = `${hour}:${minute.toString().padStart(2, '0')}`;
        const prefix = `[Son las ${timeStr} quedan ${remainingMinutes} minutos]`;

        let msg;
        let isSpecial = false;
        if (remainingMinutes === 0) {
          msg = "¡Fin de la Hack&Win 2025! ¡Feliz Halloween!";
          isSpecial = true;
          console.log('🎉 Es el mensaje final especial.');
        } else {
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

        console.log(`✅ Mensaje enviado exitosamente a las ${timeStr}. ${isSpecial ? 'Mensaje especial.' : `Índice usado: ${messageIndex - 1}`}`);
      } catch (e) {
        console.error('❌ Error enviando mensaje:', e);
        console.error('Stack trace:', e.stack);
      }
    } else {
      console.log('⏸️ Horario no válido o no es múltiplo de 20 min. No se envía mensaje.');
    }
  });

  console.log(`🕒 Mensajes programados cada 20 min de 9:00 a 15:00`);
});

console.log('🔐 Intentando login con Discord...');
client.login(TOKEN);
