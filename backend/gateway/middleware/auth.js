const { authMiddleware } = require('@sih/shared/auth');

const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/health'
];

module.exports = (req, res, next) => {
  if (publicRoutes.some(route => req.path === route || req.path.startsWith(route + '/'))) {
    return next();
  }
  return authMiddleware({})(req, res, next);
};
