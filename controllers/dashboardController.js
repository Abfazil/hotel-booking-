class DashboardController {
  constructor({ db, userModel }) {
    this.db = db;
    this.userModel = userModel;

    this.customerDashboard = this.customerDashboard.bind(this);
    this.adminDashboard = this.adminDashboard.bind(this);
  }

  async customerDashboard(req, res, next) {
    try {
      const userId = req.session.user.id;
      const bookings = await this.db.query(
        `
        SELECT
          b.booking_id AS id,
          h.hotel_name AS hotelName,
          b.check_in AS checkIn,
          b.check_out AS checkOut,
          b.booking_status AS status
        FROM bookings b
        LEFT JOIN rooms r ON r.room_id = b.room_id
        LEFT JOIN hotels h ON h.hotel_id = r.hotel_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
        LIMIT 5
        `,
        [userId]
      );

      res.render('dashboards/customer-dashboard', {
        title: 'My Dashboard — HotelEase',
        bookings,
        recentBooking: req.session.recentBooking || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async adminDashboard(req, res, next) {
    try {
      const totalUsers = await this.userModel.countUsers();
      const bookingRows = await this.db.query('SELECT COUNT(*) AS total FROM bookings');
      const disputeRows = await this.db.query('SELECT COUNT(*) AS total FROM disputes');
      const recentUsers = await this.userModel.listRecentUsers(5);
      const recentBookings = await this.db.query(
        `
        SELECT
          b.booking_id AS id,
          h.hotel_name AS hotelName,
          b.booking_status AS status,
          b.created_at AS createdAt
        FROM bookings b
        LEFT JOIN rooms r ON r.room_id = b.room_id
        LEFT JOIN hotels h ON h.hotel_id = r.hotel_id
        ORDER BY b.booking_id DESC
        LIMIT 5
        `
      );
      const recentDisputes = await this.db.query(
        `
        SELECT
          d.dispute_id AS id,
          d.issue AS issue,
          d.dispute_status AS status,
          d.created_at AS createdAt
        FROM disputes d
        ORDER BY d.dispute_id DESC
        LIMIT 5
        `
      );

      res.render('dashboards/admin-dashboard', {
        title: 'Admin Dashboard — HotelEase',
        stats: {
          totalUsers,
          totalBookings: Number(bookingRows[0]?.total || 0),
          totalDisputes: Number(disputeRows[0]?.total || 0),
        },
        recentUsers,
        recentBookings,
        recentDisputes,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
