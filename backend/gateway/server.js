const util = require('util');
if (util._extend) {
  util._extend = Object.assign;
}
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const http = require('http');

const routes = require('./config/routes');
const authGatewayMiddleware = require('./middleware/auth');
const rbacMiddleware = require('./middleware/rbac');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS
app.use(cors());

// 1.5 Security Headers & Correlation ID
const { v4: uuidv4 } = require('uuid');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// 2. Morgan request logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms [ReqID: :req[x-request-id]]'));

// 3. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// GET /health
app.get('/health', async (req, res) => {
  const status = { gateway: 'UP', timestamp: new Date().toISOString(), services: {} };
  
  const checkService = (url) => {
    return new Promise((resolve) => {
      http.get(url, (resp) => {
        resolve(resp.statusCode === 200 ? 'UP' : 'DOWN');
      }).on('error', () => resolve('DOWN'));
    });
  };

  for (const route of routes) {
    status.services[route.prefix] = await checkService(`${route.target}/health`);
  }

  res.json(status);
});

// GET /api/services
app.get('/api/services', authGatewayMiddleware, rbacMiddleware, async (req, res) => {
  res.json(routes.map(r => ({ prefix: r.prefix, target: r.target })));
});

// 4. JWT validation
app.use(authGatewayMiddleware);

// 5. RBAC validation
app.use(rbacMiddleware);

// 6. Proxy
routes.forEach(route => {
  const proxyOptions = {
    target: route.target,
    changeOrigin: true,
    pathRewrite: route.stripPrefix ? { [`^${route.prefix}`]: '' } : {},
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('x-request-id', req.id);
      if (req.user) {
        proxyReq.setHeader('x-user', JSON.stringify(req.user));
      }
    },
    onError: (err, req, res) => {
      console.error(`Proxy Error for ${route.prefix}:`, err.message);
      res.status(502).json({ error: 'Bad Gateway', details: err.message });
    }
  };
  app.use(route.prefix, createProxyMiddleware(proxyOptions));
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
