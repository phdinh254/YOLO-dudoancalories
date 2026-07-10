import express from 'express';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const HMR_PORT = Number(process.env.HMR_PORT || PORT + 21678);

const isPortAvailable = (port: number, host: string) =>
  new Promise<boolean>((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, host);
  });

if (!(await isPortAvailable(PORT, HOST))) {
  console.error(
    `Frontend port ${PORT} is already in use. Close the old dev server or run with another port, for example: set PORT=3001&& npm run dev`,
  );
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        port: HMR_PORT,
      },
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

const server = app.listen(PORT, HOST, () => {
  console.log(`Frontend server is running on http://127.0.0.1:${PORT}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Frontend port ${PORT} is already in use. Close the old dev server or run with another port, for example: set PORT=3001&& npm run dev`,
    );
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});
