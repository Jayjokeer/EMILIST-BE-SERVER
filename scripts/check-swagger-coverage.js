const fs = require('fs');
const path = require('path');

const routePrefixes = {
  'auth.routes.ts': '/auth',
  'jobs.routes.ts': '/jobs',
  'business.routes.ts': '/business',
  'chat.route.ts': '/chat',
  'product.routes.ts': '/material',
  'cart.routes.ts': '/cart',
  'promo.routes.ts': '/promo',
  'notification.routes.ts': '/notification',
  'wallet.routes.ts': '/wallet',
  'transaction.routes.ts': '/transaction',
  'private-expert.ts': '/expert',
  'target.routes.ts': '/target',
  'subscription.routes.ts': '/subscription',
  'admin.routes.ts': '/admin',
  'order.routes.ts': '/orders',
  'dashboard.routes.ts': '/dashboard',
  'webhook.routes.ts': '/webhooks',
};

const routeOperations = [];
const routeDirectory = path.join(__dirname, '..', 'src', 'routes');

for (const [fileName, prefix] of Object.entries(routePrefixes)) {
  const source = fs.readFileSync(path.join(routeDirectory, fileName), 'utf8');
  const patterns = [
    { regex: /router\.route\(["']([^"']+)["']\)\.(get|post|patch|put|delete)/g, methodIndex: 2, pathIndex: 1 },
    { regex: /router\.(get|post|patch|put|delete)\(["']([^"']+)["']/g, methodIndex: 1, pathIndex: 2 },
  ];

  for (const { regex, methodIndex, pathIndex } of patterns) {
    for (const match of source.matchAll(regex)) {
      const routePath = `${prefix}${match[pathIndex]}`
        .replace(/\/$/, '')
        .replace(/:([A-Za-z0-9_]+)/g, '{$1}');
      routeOperations.push({ method: match[methodIndex], path: routePath || '/' });
    }
  }
}

const { swaggerSpec } = require('../dist/src/docs/swagger.js');
const missing = routeOperations.filter(({ method, path: routePath }) =>
  !swaggerSpec.paths[routePath]?.[method]
);

if (missing.length > 0) {
  console.error('Routes missing from Swagger:');
  for (const route of missing) console.error(`- ${route.method.toUpperCase()} ${route.path}`);
  process.exitCode = 1;
} else {
  console.log(`Swagger covers all ${routeOperations.length} mounted route operations.`);
}

