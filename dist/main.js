"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const helmet_1 = require("helmet");
const node_os_1 = require("node:os");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((request, _response, next) => {
        if (request.path.startsWith('/api/')) {
            const origin = request.headers.origin || 'same-origin';
            console.log(`[http] ${new Date().toISOString()} ${request.method} ${request.path} remote=${request.ip} origin=${origin}`);
        }
        next();
    });
    app.use((0, helmet_1.default)({
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
    }));
    app.enableCors({ origin: '*' });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const port = Number(process.env.PORT) || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Employee verification app is listening on 0.0.0.0:${port}`);
    console.log(`Local:   http://localhost:${port}/`);
    const addresses = Object.entries((0, node_os_1.networkInterfaces)()).flatMap(([interfaceName, entries]) => (entries ?? [])
        .filter((entry) => !entry.internal && entry.family === 'IPv4')
        .map((entry) => ({ interfaceName, address: entry.address })));
    if (addresses.length === 0) {
        console.warn('No non-loopback IPv4 addresses found.');
    }
    else {
        console.log('Network addresses (try one reachable from your device):');
        for (const { interfaceName, address } of addresses) {
            console.log(`  ${interfaceName}: http://${address}:${port}/`);
        }
    }
}
void bootstrap();
//# sourceMappingURL=main.js.map