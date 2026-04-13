function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.session.flash = {
      type: 'error',
      message: 'Please log in to continue.',
    };
    res.redirect('/login');
    return;
  }

  next();
}

function redirectIfAuthenticated(req, res, next) {
  if (!req.session.user) {
    next();
    return;
  }

  if (req.session.user.role === 'admin') {
    res.redirect('/admin');
    return;
  }

  res.redirect('/dashboard');
}

module.exports = {
  requireAuth,
  redirectIfAuthenticated,
};
