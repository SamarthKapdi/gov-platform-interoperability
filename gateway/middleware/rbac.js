const { requireRole } = require('@sih/shared/auth');

module.exports = (req, res, next) => {
  const path = req.path;
  const method = req.method;

  if (path.startsWith('/api/audit/logs')) {
    return requireRole('admin', 'dept_official')(req, res, next);
  }

  if (
    (path.startsWith('/api/deptA') || path.startsWith('/api/deptB') || path.startsWith('/api/deptC')) &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  ) {
    return requireRole('admin', 'dept_official')(req, res, next);
  }

  next();
};
