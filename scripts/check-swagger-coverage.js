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
  'support.routes.ts': '/support',
  'order.routes.ts': '/orders',
  'dashboard.routes.ts': '/dashboard',
  'webhook.routes.ts': '/webhooks',
};

const routeOperations = [];
const routeDirectory = path.join(__dirname, '..', 'src', 'routes');

for (const [fileName, prefix] of Object.entries(routePrefixes)) {
  const source = fs.readFileSync(path.join(routeDirectory, fileName), 'utf8');
  const patterns = [
    { regex: /router\.route\(["']([^"']+)["']\s*\)\.(get|post|patch|put|delete)/g, methodIndex: 2, pathIndex: 1 },
    { regex: /router\.(get|post|patch|put|delete)\(["']([^"']+)["']/g, methodIndex: 1, pathIndex: 2 },
  ];

  for (const { regex, methodIndex, pathIndex } of patterns) {
    for (const match of source.matchAll(regex)) {
      const routePath = `${prefix}${match[pathIndex]}`
        .replace(/\/$/, '')
        .replace(/:([A-Za-z0-9_]+)/g, '{$1}');
      const operationLine = source.slice(match.index, source.indexOf('\n', match.index));
      const requiresAuth = /\b(?:userAuth|adminAuth|superAdminAuth)\b/.test(operationLine)
        && !/\boptionalUserAuth\b/.test(operationLine);
      routeOperations.push({ method: match[methodIndex], path: routePath || '/', requiresAuth, fileName });
    }
  }
}

const { swaggerSpec } = require('../dist/src/docs/swagger.js');
const declaredTags = new Set((swaggerSpec.tags || []).map((tag) => tag.name));
const missing = routeOperations.filter(({ method, path: routePath }) =>
  !swaggerSpec.paths[routePath]?.[method]
);

const mountedKeys = new Set(routeOperations.map(({ method, path: routePath }) => `${method} ${routePath}`));
const extra = [];
const qualityIssues = [];
for (const [routePath, pathItem] of Object.entries(swaggerSpec.paths)) {
  for (const method of ['get', 'post', 'patch', 'put', 'delete']) {
    const operation = pathItem[method];
    if (!operation) continue;
    if (!mountedKeys.has(`${method} ${routePath}`)) extra.push({ method, path: routePath });
    if (!operation.summary) qualityIssues.push(`${method.toUpperCase()} ${routePath}: missing summary`);
    if (!operation.tags?.length) qualityIssues.push(`${method.toUpperCase()} ${routePath}: missing tags`);
    for (const tag of operation.tags || []) {
      if (!declaredTags.has(tag)) qualityIssues.push(`${method.toUpperCase()} ${routePath}: undeclared tag ${tag}`);
    }
    if (!operation.responses || Object.keys(operation.responses).length === 0) {
      qualityIssues.push(`${method.toUpperCase()} ${routePath}: missing responses`);
    }
    for (const match of routePath.matchAll(/\{([^}]+)\}/g)) {
      const parameter = (operation.parameters || []).find((item) =>
        item.in === 'path' && item.name === match[1] && item.required === true
      );
      if (!parameter) qualityIssues.push(`${method.toUpperCase()} ${routePath}: missing required path parameter ${match[1]}`);
    }
  }
}

for (const route of routeOperations) {
  const operation = swaggerSpec.paths[route.path]?.[route.method];
  if (!operation) continue;
  const documentedAuth = Array.isArray(operation.security)
    && operation.security.length > 0
    && !operation.security.some((requirement) => Object.keys(requirement).length === 0);
  if (documentedAuth !== route.requiresAuth) {
    qualityIssues.push(`${route.method.toUpperCase()} ${route.path}: auth mismatch (route=${route.requiresAuth}, swagger=${documentedAuth})`);
  }
}

if (missing.length > 0) {
  console.error('Routes missing from Swagger:');
  for (const route of missing) console.error(`- ${route.method.toUpperCase()} ${route.path}`);
  process.exitCode = 1;
}

if (extra.length > 0) {
  console.error('Swagger operations without a mounted route:');
  for (const route of extra) console.error(`- ${route.method.toUpperCase()} ${route.path}`);
  process.exitCode = 1;
}

if (qualityIssues.length > 0) {
  console.error('Swagger contract quality issues:');
  for (const issue of qualityIssues) console.error(`- ${issue}`);
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log(`Swagger contract verified for all ${routeOperations.length} mounted route operations.`);
}

