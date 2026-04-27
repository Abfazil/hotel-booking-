const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

module.exports = function dashboardRoutes(dashboardController) {
  const router = express.Router();

  router.get('/dashboard', requireAuth, requireRole('customer'), dashboardController.customerDashboard);
  router.post('/dashboard/cancellations', requireAuth, requireRole('customer'), dashboardController.createCancellationRequest);
  router.post(
    '/dashboard/cancellations/:requestId/update',
    requireAuth,
    requireRole('customer'),
    dashboardController.updateCancellationRequest
  );
  router.post(
    '/dashboard/cancellations/:requestId/delete',
    requireAuth,
    requireRole('customer'),
    dashboardController.deleteCancellationRequest
  );
  router.get('/admin', requireAuth, requireRole('admin'), dashboardController.adminDashboard);
  router.post('/admin/hotels', requireAuth, requireRole('admin'), dashboardController.createHotel);
  router.post('/admin/hotels/:id/update', requireAuth, requireRole('admin'), dashboardController.updateAdminHotel);
  router.post('/admin/hotels/:id/delete', requireAuth, requireRole('admin'), dashboardController.deleteHotel);
  router.post('/admin/bookings/:bookingId/update', requireAuth, requireRole('admin'), dashboardController.updateAdminBooking);
  router.post('/admin/bookings/:bookingId/delete', requireAuth, requireRole('admin'), dashboardController.deleteAdminBooking);
  router.post('/admin/customers/:userId/update', requireAuth, requireRole('admin'), dashboardController.updateAdminCustomer);
  router.post('/admin/customers/:userId/delete', requireAuth, requireRole('admin'), dashboardController.deleteAdminCustomer);
  router.post('/admin/disputes/:disputeId/update', requireAuth, requireRole('admin'), dashboardController.updateAdminDispute);
  router.post('/admin/disputes/:disputeId/delete', requireAuth, requireRole('admin'), dashboardController.deleteAdminDispute);
  router.post(
    '/admin/cancellations/:requestId/review',
    requireAuth,
    requireRole('admin'),
    dashboardController.reviewCancellationRequest
  );
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
    '/owner/hotels/rooms/:roomId/update',
    requireAuth,
    requireRole('hotel_owner'),
    dashboardController.updateOwnerRoom
  );
  router.post(
    '/owner/hotels/rooms/:roomId/delete',
    requireAuth,
    requireRole('hotel_owner'),
    dashboardController.deleteOwnerRoom
  );
  router.post(
    '/owner/hotels/images',
    requireAuth,
    requireRole('hotel_owner'),
    dashboardController.addOwnerImage
  );

  return router;
};
