const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

module.exports = function disputeRoutes(disputeController) {
  const router = express.Router();

  router.get('/disputes', requireAuth, requireRole('customer'), disputeController.index);
  router.post('/disputes', requireAuth, requireRole('customer'), disputeController.create);

  return router;
};
