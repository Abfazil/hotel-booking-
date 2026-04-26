
const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

module.exports = function hotelRoutes(hotelController) {
  const router = express.Router();

  router.get('/', hotelController.home);
  router.get('/hotels', hotelController.list);
  router.get('/hotels/:id', hotelController.detail);
  router.post('/hotels/:id/book', requireAuth, requireRole('customer'), hotelController.bookHotel);
  router.get('/thank-you', requireAuth, requireRole('customer'), hotelController.thankYou);

  return router;
};

