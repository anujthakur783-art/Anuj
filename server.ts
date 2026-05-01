
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

// Integration with Vite
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = await vite.transformIndexHtml(url, `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Sabjiwala Express</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
        </html>
      `);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Simulated real-time tracking logic
let driverPosition = { lat: 28.6139, lng: 77.2090 }; // Starting point (Delhi)
let targetPosition = { lat: 28.6353, lng: 77.2250 }; // User point

function updatePosition() {
  const step = 0.0005;
  if (Math.abs(driverPosition.lat - targetPosition.lat) > step) {
    driverPosition.lat += driverPosition.lat < targetPosition.lat ? step : -step;
  }
  if (Math.abs(driverPosition.lng - targetPosition.lng) > step) {
    driverPosition.lng += driverPosition.lng < targetPosition.lng ? step : -step;
  }
  
  io.emit('driver_update', driverPosition);
}

// Update driver position every 2 seconds
setInterval(updatePosition, 2000);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial position
  socket.emit('driver_update', driverPosition);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
