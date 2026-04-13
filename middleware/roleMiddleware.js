function requireRole(role) {
  return function checkRole(req, res, next) {
    if (!req.session.user) {
      req.session.flash = {
        type: 'error',
        message: 'Please log in to continue.',
      };
      res.redirect('/login');
      return;
    }

    if (req.session.user.role !== role) {
      req.session.flash = {
        type: 'error',
        message: 'You do not have permission to access this page.',
      };
      const fallback = req.session.user.role === 'admin' ? '/admin' : '/dashboard';
      res.redirect(fallback);
      return;
    }

    next();
  };
}

module.exports = {
  requireRole,
};
