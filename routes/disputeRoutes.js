const express = require('express');

module.exports = function disputeRoutes(disputeController) {
  const router = express.Router();

  router.get('/disputes', disputeController.index);
  router.post('/disputes', disputeController.create);

  return router;
};
