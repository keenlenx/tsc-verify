import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const tlsCertPath = process.env.TLS_CERT_PATH;
  const tlsKeyPath = process.env.TLS_KEY_PATH;
  if (Boolean(tlsCertPath) !== Boolean(tlsKeyPath)) {
    throw new Error('Set both TLS_CERT_PATH and TLS_KEY_PATH to enable HTTPS.');
  }

  const protocol = tlsCertPath ? 'https' : 'http';
  const app = await NestFactory.create(
    AppModule,
    tlsCertPath && tlsKeyPath
      ? {
          httpsOptions: {
            cert: readFileSync(tlsCertPath),
            key: readFileSync(tlsKeyPath),
          },
        }
      : {},
  );

  app.use((request, _response, next) => {
    if (request.path.startsWith('/api/')) {
      const origin = request.headers.origin || 'same-origin';
      console.log(
        `[http] ${new Date().toISOString()} ${request.method} ${request.path} remote=${request.ip} origin=${origin}`,
      );
    }
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'https://cdn.jsdelivr.net'],
          workerSrc: ["'self'", 'blob:', 'https://cdn.jsdelivr.net'],
          fontSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
          upgradeInsecureRequests: null,
        },
      },
    }),
  );
  app.enableCors({ origin: '*' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Employee verification app is listening on ${protocol}://0.0.0.0:${port}`);
  console.log(`Local:   ${protocol}://localhost:${port}/`);

  const addresses = Object.entries(networkInterfaces()).flatMap(([interfaceName, entries]) =>
    (entries ?? [])
      .filter((entry) => !entry.internal && entry.family === 'IPv4')
      .map((entry) => ({ interfaceName, address: entry.address })),
  );

  if (addresses.length === 0) {
    console.warn('No non-loopback IPv4 addresses found.');
  } else {
    console.log('Network addresses (try one reachable from your device):');
    for (const { interfaceName, address } of addresses) {
      console.log(`  ${interfaceName}: ${protocol}://${address}:${port}/`);
    }
  }
}

void bootstrap();