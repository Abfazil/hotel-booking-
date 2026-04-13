const express = require('express');
const { redirectIfAuthenticated } = require('../middleware/authMiddleware');

module.exports = function authRoutes(authController) {
  const router = express.Router();

  router.get('/register', redirectIfAuthenticated, authController.showRegister);
  router.post('/register', redirectIfAuthenticated, authController.register);

  router.get('/login', redirectIfAuthenticated, authController.showLogin);
  router.post('/login', redirectIfAuthenticated, authController.login);

  router.get('/logout', authController.logout);

  return router;
};
