const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

module.exports = function dashboardRoutes(dashboardController) {
  const router = express.Router();

  router.get('/dashboard', requireAuth, requireRole('customer'), dashboardController.customerDashboard);
  router.get('/admin', requireAuth, requireRole('admin'), dashboardController.adminDashboard);

  return router;
};
