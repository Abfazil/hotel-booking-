const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

module.exports = function dashboardRoutes(dashboardController) {
  const router = express.Router();

  router.get('/dashboard', requireAuth, requireRole('customer'), dashboardController.customerDashboard);
  router.get('/admin', requireAuth, requireRole('admin'), dashboardController.adminDashboard);
  router.post('/admin/hotels', requireAuth, requireRole('admin'), dashboardController.createHotel);
  router.post('/admin/hotels/:id/delete', requireAuth, requireRole('admin'), dashboardController.deleteHotel);
  router.post(
    '/admin/owner-requests/:requestId/approve',
    requireAuth,
    requireRole('admin'),
    dashboardController.approveHotelOwnerRequest
  );
  router.post(
    '/admin/owner-requests/:requestId/reject',
    requireAuth,
    requireRole('admin'),
    dashboardController.rejectHotelOwnerRequest
  );

  router.get(
    '/owner/dashboard',
    requireAuth,
    requireRole('hotel_owner'),
    dashboardController.hotelOwnerDashboard
  );
  router.post(
    '/owner/hotels/rooms',
    requireAuth,
    requireRole('hotel_owner'),
    dashboardController.addOwnerRoom
  );
  router.post(
    '/owner/hotels/images',
    requireAuth,
    requireRole('hotel_owner'),
    dashboardController.addOwnerImage
  );

  return router;
};
