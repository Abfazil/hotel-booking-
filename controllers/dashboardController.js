class DashboardController {
  constructor({ db, userModel, hotelModel }) {
    this.db = db;
    this.userModel = userModel;
    this.hotelModel = hotelModel;

    this.customerDashboard = this.customerDashboard.bind(this);
    this.adminDashboard = this.adminDashboard.bind(this);
    this.createHotel = this.createHotel.bind(this);
    this.deleteHotel = this.deleteHotel.bind(this);
  }

  setFlash(req, type, message) {
    req.session.flash = { type, message };
  }

  parseRoomsInput(roomsRaw) {
    const lines = String(roomsRaw || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const rooms = lines.map((line) => {
      const [roomTypeRaw, priceRaw, capacityRaw] = line.split('|').map((part) => part.trim());
      const roomType = String(roomTypeRaw || '');
      const pricePerNight = Number(priceRaw);
      const capacity = Number(capacityRaw);

      return {
        roomType,
        pricePerNight,
        capacity,
        available: 1,
      };
    });

    const hasInvalidRoom = rooms.some(
      (room) =>
        !room.roomType ||
        !Number.isFinite(room.pricePerNight) ||
        room.pricePerNight <= 0 ||
        !Number.isInteger(room.capacity) ||
        room.capacity <= 0
    );

    if (!rooms.length || hasInvalidRoom) {
      return { isValid: false, rooms: [] };
    }

    return { isValid: true, rooms };
  }

  parseImagesInput(imagesRaw) {
    const images = String(imagesRaw || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const hasInvalidImage = images.some((url) => {
      if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
        return true;
      }

      try {
        // Allow relative image paths under /public and absolute URLs.
        if (url.startsWith('/')) return false;
        // eslint-disable-next-line no-new
        new URL(url);
        return false;
      } catch (err) {
        return true;
      }
    });

    return { isValid: !hasInvalidImage, images };
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
      const selectedBookingStatus = String(req.query.bookingStatus || '').trim();
      const selectedDisputeStatus = String(req.query.disputeStatus || '').trim();

      const totalUsers = await this.userModel.countUsers();
      const bookingRows = await this.db.query('SELECT COUNT(*) AS total FROM bookings');
      const disputeRows = await this.db.query('SELECT COUNT(*) AS total FROM disputes');
      const bookingStatusRows = await this.db.query(
        `
        SELECT
          COALESCE(NULLIF(b.booking_status, ''), 'Unknown') AS status,
          COUNT(*) AS total
        FROM bookings b
        GROUP BY COALESCE(NULLIF(b.booking_status, ''), 'Unknown')
        ORDER BY total DESC
        `
      );
      const disputeStatusRows = await this.db.query(
        `
        SELECT
          COALESCE(NULLIF(d.dispute_status, ''), 'Unknown') AS status,
          COUNT(*) AS total
        FROM disputes d
        GROUP BY COALESCE(NULLIF(d.dispute_status, ''), 'Unknown')
        ORDER BY total DESC
        `
      );
      const recentUsers = await this.userModel.listRecentUsers(5);
      const customers = await this.userModel.listCustomersForAdmin(30);
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
      let filteredBookings = [];
      let filteredDisputes = [];

      if (selectedBookingStatus) {
        filteredBookings = await this.db.query(
          `
          SELECT
            b.booking_id AS id,
            h.hotel_name AS hotelName,
            COALESCE(NULLIF(b.booking_status, ''), 'Unknown') AS status,
            b.check_in AS checkIn,
            b.check_out AS checkOut
          FROM bookings b
          LEFT JOIN rooms r ON r.room_id = b.room_id
          LEFT JOIN hotels h ON h.hotel_id = r.hotel_id
          WHERE COALESCE(NULLIF(b.booking_status, ''), 'Unknown') = ?
          ORDER BY b.booking_id DESC
          `,
          [selectedBookingStatus]
        );
      }

      if (selectedDisputeStatus) {
        filteredDisputes = await this.db.query(
          `
          SELECT
            d.dispute_id AS id,
            d.booking_id AS bookingId,
            COALESCE(NULLIF(d.dispute_status, ''), 'Unknown') AS status,
            d.issue AS issue,
            d.created_at AS createdAt
          FROM disputes d
          WHERE COALESCE(NULLIF(d.dispute_status, ''), 'Unknown') = ?
          ORDER BY d.dispute_id DESC
          `,
          [selectedDisputeStatus]
        );
      }

      const managedHotels = await this.hotelModel.getHotelsForAdmin();

      res.render('dashboards/admin-dashboard', {
        title: 'Admin Dashboard — HotelEase',
        stats: {
          totalUsers,
          totalBookings: Number(bookingRows[0]?.total || 0),
          totalDisputes: Number(disputeRows[0]?.total || 0),
        },
        bookingStatusSummary: bookingStatusRows.map((row) => ({
          status: row.status,
          total: Number(row.total || 0),
          encodedStatus: encodeURIComponent(row.status),
        })),
        disputeStatusSummary: disputeStatusRows.map((row) => ({
          status: row.status,
          total: Number(row.total || 0),
          encodedStatus: encodeURIComponent(row.status),
        })),
        selectedBookingStatus,
        selectedDisputeStatus,
        filteredBookings,
        filteredDisputes,
        recentUsers,
        customers,
        recentBookings,
        recentDisputes,
        managedHotels,
      });
    } catch (err) {
      next(err);
    }
  }

  async createHotel(req, res, next) {
    try {
      const name = String(req.body.name || '').trim();
      const city = String(req.body.city || '').trim();
      const country = String(req.body.country || '').trim();
      const address = String(req.body.address || '').trim();
      const rating = Number(req.body.rating);

      if (!name || !city || !country || !address) {
        this.setFlash(req, 'error', 'Please fill in all required hotel fields.');
        res.redirect('/admin');
        return;
      }

      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        this.setFlash(req, 'error', 'Rating must be a number between 1 and 5.');
        res.redirect('/admin');
        return;
      }

      const parsedRooms = this.parseRoomsInput(req.body.rooms);
      if (!parsedRooms.isValid) {
        this.setFlash(
          req,
          'error',
          'Rooms format is invalid. Use one room per line: Room Type|Price|Capacity.'
        );
        res.redirect('/admin');
        return;
      }

      const parsedImages = this.parseImagesInput(req.body.images);
      if (!parsedImages.isValid) {
        this.setFlash(req, 'error', 'Each image URL must be a valid absolute URL or start with /.');
        res.redirect('/admin');
        return;
      }

      await this.hotelModel.createHotel({
        name,
        city,
        country,
        address,
        rating,
        rooms: parsedRooms.rooms,
        images: parsedImages.images,
      });

      this.setFlash(req, 'success', `Hotel "${name}" added successfully.`);
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async deleteHotel(req, res, next) {
    try {
      const hotelId = Number(req.params.id);
      if (!Number.isFinite(hotelId)) {
        this.setFlash(req, 'error', 'Invalid hotel id.');
        res.redirect('/admin');
        return;
      }

      const result = await this.hotelModel.deleteHotelById(hotelId);
      if (!result.deleted) {
        if (result.reason === 'has-dependencies') {
          this.setFlash(
            req,
            'error',
            `Cannot delete this hotel because it has ${result.bookingsCount} booking(s) and ${result.reviewsCount} review(s).`
          );
        } else {
          this.setFlash(req, 'error', 'Hotel could not be deleted.');
        }
        res.redirect('/admin');
        return;
      }

      this.setFlash(req, 'success', 'Hotel removed successfully.');
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
