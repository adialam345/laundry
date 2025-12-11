import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import * as readline from 'readline';

const app = new Hono();
let sock;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let pairingCode = null;
let pendingPhoneNumber = null;
let currentQR = null;
let connectionStatus = 'disconnected';

const logger = pino({ level: 'silent' });

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

async function connectToWhatsApp(phoneNumber = null) {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const isNewAuth = !state.creds.registered;
    const usePairingCode = phoneNumber && isNewAuth;

    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      logger,
      browser: ['WhatsApp Gateway', 'Chrome', '120.0.0'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });

    if (usePairingCode) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(phoneNumber);
          pairingCode = code;
          console.log('\n========================================');
          console.log('PAIRING CODE: ' + code);
          console.log('========================================');
          console.log('Enter this code in WhatsApp > Linked Devices > Link a Device');
          console.log('========================================\n');
        } catch (err) {
          console.error('Failed to get pairing code:', err.message);
        }
      }, 3000);
    }

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !usePairingCode) {
        currentQR = qr;
        connectionStatus = 'qr_ready';
        console.log('QR Code ready - scan via web interface at http://localhost:5173');
        // qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output.statusCode
          : 500;

        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        isConnected = false;
        pairingCode = null;
        currentQR = null;
        connectionStatus = 'disconnected';

        console.log(`Connection closed. Status: ${statusCode}, Reason: ${lastDisconnect?.error?.message || 'Unknown'}`);

        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          connectionStatus = 'reconnecting';
          console.log(`Reconnecting... (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          setTimeout(() => {
            connectToWhatsApp(pendingPhoneNumber);
          }, 3000);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          connectionStatus = 'failed';
          console.log('Connection failed. Try pairing code method via web interface.');
          reconnectAttempts = 0;
        } else {
          connectionStatus = 'logged_out';
          console.log('Logged out. Delete auth_info folder and restart.');
        }
      } else if (connection === 'open') {
        isConnected = true;
        pairingCode = null;
        currentQR = null;
        pendingPhoneNumber = null;
        reconnectAttempts = 0;
        connectionStatus = 'connected';
        console.log('WhatsApp connected successfully!');
      } else if (connection === 'connecting') {
        connectionStatus = 'connecting';
        console.log('Connecting to WhatsApp...');
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (error) {
    console.error('Error in connectToWhatsApp:', error);
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      setTimeout(() => connectToWhatsApp(pendingPhoneNumber), 5000);
    }
  }
}

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Laundry WA Gateway API',
    whatsappStatus: isConnected ? 'connected' : 'disconnected'
  });
});

app.get('/api/status', (c) => {
  return c.json({
    connected: isConnected,
    status: connectionStatus,
    qrCode: currentQR,
    pairingCode: pairingCode,
    message: isConnected ? 'WhatsApp is connected' : 'WhatsApp is not connected'
  });
});

app.post('/api/pair', async (c) => {
  try {
    const { phone } = await c.req.json();

    if (!phone) {
      return c.json({ success: false, error: 'Phone number is required (e.g., 628123456789)' }, 400);
    }

    if (isConnected) {
      return c.json({ success: false, error: 'WhatsApp is already connected' }, 400);
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    pendingPhoneNumber = cleanPhone;
    pairingCode = null;

    if (sock) {
      sock.end();
    }

    await connectToWhatsApp(cleanPhone);

    await new Promise(resolve => setTimeout(resolve, 5000));

    return c.json({
      success: true,
      message: 'Pairing initiated. Check /api/status for the pairing code.',
      pairingCode: pairingCode
    });
  } catch (error) {
    console.error('Error initiating pairing:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to initiate pairing'
    }, 500);
  }
});

app.post('/api/send', async (c) => {
  try {
    const { phone, message } = await c.req.json();

    if (!isConnected) {
      return c.json({ success: false, error: 'WhatsApp not connected' }, 503);
    }

    if (!phone || !message) {
      return c.json({ success: false, error: 'Phone and message are required' }, 400);
    }

    const jid = phone.includes('@s.whatsapp.net') ? phone : `${phone}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text: message });

    return c.json({
      success: true,
      message: 'Message sent successfully',
      to: phone
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({
      success: false,
      error: error.message || 'Failed to send message'
    }, 500);
  }
});

app.post('/api/reset', async (c) => {
  try {
    if (sock) {
      sock.end();
    }

    // We can't easily delete the folder while the process is running due to file locks,
    // but we can try to clear the state or at least signal the user to restart.
    // For now, we'll try to re-initialize.

    isConnected = false;
    connectionStatus = 'disconnected';
    currentQR = null;
    pairingCode = null;

    console.log('Resetting connection...');
    await connectToWhatsApp();

    return c.json({ success: true, message: 'Connection reset initiated' });
  } catch (error) {
    console.error('Error resetting:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

const port = 3000;
console.log(`Server running on http://localhost:${port}`);
console.log('Open http://localhost:5173 to connect WhatsApp');

async function startServer() {
  try {
    const { state } = await useMultiFileAuthState('auth_info');
    if (state.creds.registered) {
      await connectToWhatsApp();
    } else {
      console.log('No saved credentials. Initializing connection for QR code...');
      await connectToWhatsApp();
    }
  } catch (err) {
    console.error('Error checking credentials:', err);
  }
}

startServer();

serve({
  fetch: app.fetch,
  port
});
