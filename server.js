const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

module.paths.unshift(path.resolve(__dirname, 'frontend/node_modules'));
const next = require('next');

const BACKEND_PORT = 8000;
const FRONTEND_PORT = 5000;
const BACKEND_READY_TIMEOUT = 60000;

let backendProcess = null;
let frontendServer = null;

async function waitForBackend() {
  const startTime = Date.now();
  console.log('Waiting for backend to be ready on port', BACKEND_PORT);
  
  while (Date.now() - startTime < BACKEND_READY_TIMEOUT) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/`, (res) => {
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      console.log('✓ Backend is ready!');
      return true;
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error('Backend failed to start within timeout');
}

async function startBackend() {
  console.log('Starting FastAPI backend...');
  backendProcess = spawn('python', ['main_simple.py'], {
    cwd: './backend',
    stdio: 'inherit',
    env: { ...process.env }
  });

  backendProcess.on('exit', (code, signal) => {
    console.error(`Backend process exited with code ${code}, signal ${signal}`);
    process.exit(1);
  });

  await waitForBackend();
}

async function startFrontend() {
  console.log('Starting Next.js frontend...');
  process.env.BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

  const app = next({
    dev: false,
    dir: './frontend'
  });

  await app.prepare();

  frontendServer = http.createServer(app.getRequestHandler());

  await new Promise((resolve, reject) => {
    const handleError = (error) => {
      if (frontendServer) {
        frontendServer.off('error', handleError);
      }
      reject(error);
    };

    frontendServer.once('error', handleError);
    frontendServer.listen(FRONTEND_PORT, '0.0.0.0', () => {
      if (frontendServer) {
        frontendServer.off('error', handleError);
      }
      console.log(`✓ Frontend ready on http://0.0.0.0:${FRONTEND_PORT}`);
      resolve();
    });
  });
}

function handleShutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendServer) {
    const serverToClose = frontendServer;
    frontendServer = null;
    serverToClose.close(() => process.exit(0));
    return;
  }
  process.exit(0);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGQUIT', () => handleShutdown('SIGQUIT'));

async function main() {
  try {
    const backendReady = startBackend();
    await startFrontend();
    await backendReady;
  } catch (error) {
    console.error('Failed to start services:', error);
    if (backendProcess) {
      backendProcess.kill();
    }
    if (frontendServer) {
      const serverToClose = frontendServer;
      frontendServer = null;
      serverToClose.close(() => process.exit(1));
      return;
    }
    process.exit(1);
  }
}

main();
