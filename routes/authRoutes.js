

const express = require('express');

module.exports = function authRoutes(authController) {
  const router = express.Router();

  router.get('/login', authController.login);
  router.get('/register', authController.register);

  return router;
};

