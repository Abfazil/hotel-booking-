class DashboardController {
  constructor({ db, userModel, hotelModel }) {
    this.db = db;
    this.userModel = userModel;
    this.hotelModel = hotelModel;

    this.customerDashboard = this.customerDashboard.bind(this);
    this.adminDashboard = this.adminDashboard.bind(this);
    this.createHotel = this.createHotel.bind(this);
    this.deleteHotel = this.deleteHotel.bind(this);
    this.approveHotelOwnerRequest = this.approveHotelOwnerRequest.bind(this);
    this.rejectHotelOwnerRequest = this.rejectHotelOwnerRequest.bind(this);
    this.hotelOwnerDashboard = this.hotelOwnerDashboard.bind(this);
    this.addOwnerRoom = this.addOwnerRoom.bind(this);
    this.updateOwnerRoom = this.updateOwnerRoom.bind(this);
    this.deleteOwnerRoom = this.deleteOwnerRoom.bind(this);
    this.addOwnerImage = this.addOwnerImage.bind(this);
    this.updateAdminHotel = this.updateAdminHotel.bind(this);
    this.updateAdminBooking = this.updateAdminBooking.bind(this);
    this.deleteAdminBooking = this.deleteAdminBooking.bind(this);
    this.updateAdminCustomer = this.updateAdminCustomer.bind(this);
    this.deleteAdminCustomer = this.deleteAdminCustomer.bind(this);
    this.updateAdminDispute = this.updateAdminDispute.bind(this);
    this.deleteAdminDispute = this.deleteAdminDispute.bind(this);
    this.createCancellationRequest = this.createCancellationRequest.bind(this);
    this.updateCancellationRequest = this.updateCancellationRequest.bind(this);
    this.deleteCancellationRequest = this.deleteCancellationRequest.bind(this);
    this.reviewCancellationRequest = this.reviewCancellationRequest.bind(this);
  }

  setFlash(req, type, message) {
    req.session.flash = { type, message };
  }

  setRowFlash(req, section, id, type, message) {
    req.session.rowFlash = { section, id: Number(id), type, message };
  }

  async ensureCancellationTable() {
    await this.db.query(
      `
      CREATE TABLE IF NOT EXISTS cancellation_requests (
        cancellation_id INT NOT NULL AUTO_INCREMENT,
        booking_id INT NOT NULL,
        user_id INT NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending',
        admin_notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (cancellation_id),
        KEY booking_id (booking_id),
        KEY user_id (user_id)
      )
      `
    );
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

  parseHotelId(rawHotelId) {
    const hotelId = Number(rawHotelId);
    if (!Number.isFinite(hotelId) || hotelId <= 0) return null;
    return hotelId;
  }

  async customerDashboard(req, res, next) {
    try {
      const userId = req.session.user.id;
      await this.ensureCancellationTable();
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
      const cancellationRequests = await this.db.query(
        `
        SELECT
          c.cancellation_id AS id,
          c.booking_id AS bookingId,
          c.reason AS reason,
          c.status AS status,
          c.admin_notes AS adminNotes,
          c.created_at AS createdAt,
          h.hotel_name AS hotelName
        FROM cancellation_requests c
        LEFT JOIN bookings b ON b.booking_id = c.booking_id
        LEFT JOIN rooms r ON r.room_id = b.room_id
        LEFT JOIN hotels h ON h.hotel_id = r.hotel_id
        WHERE c.user_id = ?
        ORDER BY c.cancellation_id DESC
        LIMIT 20
        `,
        [userId]
      );

      res.render('dashboards/customer-dashboard', {
        title: 'My Dashboard — HotelEase',
        bookings,
        cancellationRequests,
        recentBooking: req.session.recentBooking || null,
      });
    } catch (err) {
      next(err);
    }
  }

  async adminDashboard(req, res, next) {
    try {
      const userSchema = await this.userModel.resolveSchema();
      const userNameSelect = userSchema.isLegacy
        ? "TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')))"
        : 'u.name';
      await this.ensureCancellationTable();
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
          CASE
            WHEN LOWER(COALESCE(NULLIF(d.dispute_status, ''), 'pending')) = 'resolved' THEN 'Resolved'
            ELSE 'Pending'
          END AS status,
          COUNT(*) AS total
        FROM disputes d
        GROUP BY
          CASE
            WHEN LOWER(COALESCE(NULLIF(d.dispute_status, ''), 'pending')) = 'resolved' THEN 'Resolved'
            ELSE 'Pending'
          END
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
          ${userNameSelect} AS customerName,
          b.booking_status AS status,
          b.created_at AS createdAt
        FROM bookings b
        LEFT JOIN users u ON ${userSchema.isLegacy ? 'u.user_id' : 'u.id'} = b.user_id
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
          d.booking_id AS bookingId,
          d.user_id AS userId,
          d.issue AS issue,
          d.dispute_status AS status,
          d.created_at AS createdAt
        FROM disputes d
        ORDER BY d.dispute_id DESC
        LIMIT 5
        `
      );
      const cancellationStatusRows = await this.db.query(
        `
        SELECT
          COALESCE(NULLIF(status, ''), 'Pending') AS status,
          COUNT(*) AS total
        FROM cancellation_requests
        GROUP BY COALESCE(NULLIF(status, ''), 'Pending')
        ORDER BY total DESC
        `
      );
      const recentCancellationRequests = await this.db.query(
        `
        SELECT
          c.cancellation_id AS id,
          c.booking_id AS bookingId,
          c.user_id AS userId,
          c.reason AS reason,
          c.status AS status,
          c.admin_notes AS adminNotes,
          c.created_at AS createdAt
        FROM cancellation_requests c
        ORDER BY c.cancellation_id DESC
        LIMIT 20
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
            ${userNameSelect} AS customerName,
            COALESCE(NULLIF(b.booking_status, ''), 'Unknown') AS status,
            b.check_in AS checkIn,
            b.check_out AS checkOut
          FROM bookings b
          LEFT JOIN users u ON ${userSchema.isLegacy ? 'u.user_id' : 'u.id'} = b.user_id
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
            CASE
              WHEN LOWER(COALESCE(NULLIF(d.dispute_status, ''), 'pending')) = 'resolved' THEN 'Resolved'
              ELSE 'Pending'
            END AS status,
            d.issue AS issue,
            d.created_at AS createdAt
          FROM disputes d
          WHERE (
            CASE
              WHEN LOWER(COALESCE(NULLIF(d.dispute_status, ''), 'pending')) = 'resolved' THEN 'Resolved'
              ELSE 'Pending'
            END
          ) = ?
          ORDER BY d.dispute_id DESC
          `,
          [selectedDisputeStatus]
        );
      }

      const managedHotels = await this.hotelModel.getHotelsForAdmin();
      const pendingOwnerRequests = await this.userModel.listPendingHotelOwnerRequests(50);
      const rowFlash = req.session.rowFlash || null;
      delete req.session.rowFlash;

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
        cancellationStatusSummary: cancellationStatusRows.map((row) => ({
          status: row.status,
          total: Number(row.total || 0),
        })),
        recentCancellationRequests,
        managedHotels,
        pendingOwnerRequests,
        rowFlash,
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
          this.setRowFlash(req, 'hotel', hotelId, 'error', 'Cannot delete hotel with bookings/reviews.');
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

      this.setRowFlash(req, 'hotel', hotelId, 'success', 'Hotel removed.');
      this.setFlash(req, 'success', 'Hotel removed successfully.');
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async approveHotelOwnerRequest(req, res, next) {
    try {
      const requestId = Number(req.params.requestId);
      if (!Number.isFinite(requestId) || requestId <= 0) {
        this.setFlash(req, 'error', 'Invalid request id.');
        res.redirect('/admin');
        return;
      }

      const request = await this.userModel.getHotelOwnerRequestById(requestId);
      if (!request || request.status !== 'pending') {
        this.setFlash(req, 'error', 'Request not found or already reviewed.');
        res.redirect('/admin');
        return;
      }

      await this.userModel.setUserRole(request.userId, 'hotel_owner');
      const hotelId = await this.hotelModel.createHotelForOwner({
        name: request.hotelName,
        city: request.city,
        country: request.country,
        address: request.address,
        rating: Number(request.rating || 4),
        ownerUserId: Number(request.userId),
      });
      await this.userModel.attachOwnerToHotel({ userId: Number(request.userId), hotelId });
      await this.userModel.updateHotelOwnerRequestStatus({
        requestId,
        status: 'approved',
        reviewedBy: req.session.user.id,
        reviewNotes: 'Approved by admin',
      });

      this.setFlash(req, 'success', 'Hotel owner request approved.');
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async rejectHotelOwnerRequest(req, res, next) {
    try {
      const requestId = Number(req.params.requestId);
      const reviewNotes = String(req.body.reviewNotes || '').trim();
      if (!Number.isFinite(requestId) || requestId <= 0) {
        this.setFlash(req, 'error', 'Invalid request id.');
        res.redirect('/admin');
        return;
      }

      const request = await this.userModel.getHotelOwnerRequestById(requestId);
      if (!request || request.status !== 'pending') {
        this.setFlash(req, 'error', 'Request not found or already reviewed.');
        res.redirect('/admin');
        return;
      }

      await this.userModel.setUserRole(request.userId, 'customer');
      await this.userModel.updateHotelOwnerRequestStatus({
        requestId,
        status: 'rejected',
        reviewedBy: req.session.user.id,
        reviewNotes: reviewNotes || 'Rejected by admin',
      });

      this.setFlash(req, 'success', 'Hotel owner request rejected.');
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async hotelOwnerDashboard(req, res, next) {
    try {
      const ownerUserId = req.session.user.id;
      const ownerHotels = await this.hotelModel.getHotelsForOwner(ownerUserId);
      const selectedHotelId = this.parseHotelId(req.query.hotelId);
      const selectedHotel =
        selectedHotelId && ownerHotels.some((hotel) => hotel.id === selectedHotelId)
          ? await this.hotelModel.getOwnerHotelDetails(ownerUserId, selectedHotelId)
          : null;

      res.render('dashboards/hotel-owner-dashboard', {
        title: 'Hotel Owner Dashboard — HotelEase',
        ownerHotels,
        selectedHotelId,
        selectedHotel,
      });
    } catch (err) {
      next(err);
    }
  }

  async addOwnerRoom(req, res, next) {
    try {
      const ownerUserId = req.session.user.id;
      const hotelId = this.parseHotelId(req.body.hotelId);
      const roomType = String(req.body.roomType || '').trim();
      const pricePerNight = Number(req.body.pricePerNight);
      const capacity = Number(req.body.capacity);
      const available = String(req.body.available || '1') === '1';

      if (!hotelId || !roomType) {
        this.setFlash(req, 'error', 'Hotel and room type are required.');
        res.redirect('/owner/dashboard');
        return;
      }
      if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
        this.setFlash(req, 'error', 'Price per night must be greater than 0.');
        res.redirect(`/owner/dashboard?hotelId=${hotelId}`);
        return;
      }
      if (!Number.isInteger(capacity) || capacity <= 0) {
        this.setFlash(req, 'error', 'Capacity must be a positive whole number.');
        res.redirect(`/owner/dashboard?hotelId=${hotelId}`);
        return;
      }

      const added = await this.hotelModel.addRoomForOwner(ownerUserId, hotelId, {
        roomType,
        pricePerNight,
        capacity,
        available,
      });
      if (!added) {
        this.setFlash(req, 'error', 'You are not allowed to manage this hotel.');
        res.redirect('/owner/dashboard');
        return;
      }

      this.setFlash(req, 'success', 'Room added successfully.');
      res.redirect(`/owner/dashboard?hotelId=${hotelId}`);
    } catch (err) {
      next(err);
    }
  }

  async updateOwnerRoom(req, res, next) {
    try {
      const ownerUserId = req.session.user.id;
      const hotelId = this.parseHotelId(req.body.hotelId);
      const roomId = Number(req.params.roomId);
      const roomType = String(req.body.roomType || '').trim();
      const pricePerNight = Number(req.body.pricePerNight);
      const capacity = Number(req.body.capacity);
      const available = String(req.body.available || '1') === '1';

      if (!hotelId || !Number.isFinite(roomId) || !roomType) {
        this.setFlash(req, 'error', 'Invalid room update request.');
        res.redirect('/owner/dashboard');
        return;
      }
      if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
        this.setFlash(req, 'error', 'Price per night must be greater than 0.');
        res.redirect(`/owner/dashboard?hotelId=${hotelId}`);
        return;
      }
      if (!Number.isInteger(capacity) || capacity <= 0) {
        this.setFlash(req, 'error', 'Capacity must be a positive whole number.');
        res.redirect(`/owner/dashboard?hotelId=${hotelId}`);
        return;
      }

      const updated = await this.hotelModel.updateRoomForOwner(ownerUserId, hotelId, roomId, {
        roomType,
        pricePerNight,
        capacity,
        available,
      });
      this.setFlash(req, updated ? 'success' : 'error', updated ? 'Room updated successfully.' : 'Unable to update room.');
      res.redirect(`/owner/dashboard?hotelId=${hotelId}`);
    } catch (err) {
      next(err);
    }
  }

  async deleteOwnerRoom(req, res, next) {
    try {
      const ownerUserId = req.session.user.id;
      const hotelId = this.parseHotelId(req.body.hotelId || req.query.hotelId);
      const roomId = Number(req.params.roomId);
      if (!hotelId || !Number.isFinite(roomId)) {
        this.setFlash(req, 'error', 'Invalid room delete request.');
        res.redirect('/owner/dashboard');
        return;
      }

      const deleted = await this.hotelModel.deleteRoomForOwner(ownerUserId, hotelId, roomId);
      this.setFlash(
        req,
        deleted ? 'success' : 'error',
        deleted ? 'Room deleted successfully.' : 'Room could not be deleted (it may have bookings).'
      );
      res.redirect(`/owner/dashboard?hotelId=${hotelId}`);
    } catch (err) {
      next(err);
    }
  }

  async addOwnerImage(req, res, next) {
    try {
      const ownerUserId = req.session.user.id;
      const hotelId = this.parseHotelId(req.body.hotelId);
      const imageUrl = String(req.body.imageUrl || '').trim();

      if (!hotelId || !imageUrl) {
        this.setFlash(req, 'error', 'Hotel and image URL are required.');
        res.redirect('/owner/dashboard');
        return;
      }

      const imagesResult = this.parseImagesInput(imageUrl);
      if (!imagesResult.isValid) {
        this.setFlash(req, 'error', 'Image URL must be absolute or start with /.');
        res.redirect(`/owner/dashboard?hotelId=${hotelId}`);
        return;
      }

      const added = await this.hotelModel.addImageForOwner(ownerUserId, hotelId, imageUrl);
      if (!added) {
        this.setFlash(req, 'error', 'You are not allowed to manage this hotel.');
        res.redirect('/owner/dashboard');
        return;
      }

      this.setFlash(req, 'success', 'Image added successfully.');
      res.redirect(`/owner/dashboard?hotelId=${hotelId}`);
    } catch (err) {
      next(err);
    }
  }

  async createCancellationRequest(req, res, next) {
    try {
      await this.ensureCancellationTable();
      const userId = req.session.user.id;
      const bookingId = Number(req.body.bookingId);
      const reason = String(req.body.reason || '').trim();
      if (!Number.isFinite(bookingId) || !reason) {
        this.setFlash(req, 'error', 'Booking and cancellation reason are required.');
        res.redirect('/dashboard');
        return;
      }

      const bookingRows = await this.db.query(
        'SELECT booking_id FROM bookings WHERE booking_id = ? AND user_id = ? LIMIT 1',
        [bookingId, userId]
      );
      if (!bookingRows.length) {
        this.setFlash(req, 'error', 'Booking not found for your account.');
        res.redirect('/dashboard');
        return;
      }

      await this.db.query(
        `
        INSERT INTO cancellation_requests (booking_id, user_id, reason, status)
        VALUES (?, ?, ?, 'Pending')
        `,
        [bookingId, userId, reason]
      );
      this.setFlash(req, 'success', 'Cancellation request submitted.');
      res.redirect('/dashboard');
    } catch (err) {
      next(err);
    }
  }

  async updateCancellationRequest(req, res, next) {
    try {
      await this.ensureCancellationTable();
      const userId = req.session.user.id;
      const requestId = Number(req.params.requestId);
      const reason = String(req.body.reason || '').trim();
      if (!Number.isFinite(requestId) || !reason) {
        this.setFlash(req, 'error', 'Invalid cancellation update.');
        res.redirect('/dashboard');
        return;
      }
      const result = await this.db.query(
        `
        UPDATE cancellation_requests
        SET reason = ?
        WHERE cancellation_id = ? AND user_id = ? AND status = 'Pending'
        `,
        [reason, requestId, userId]
      );
      this.setFlash(
        req,
        Number(result.affectedRows || 0) > 0 ? 'success' : 'error',
        Number(result.affectedRows || 0) > 0
          ? 'Cancellation request updated.'
          : 'Only pending requests can be edited.'
      );
      res.redirect('/dashboard');
    } catch (err) {
      next(err);
    }
  }

  async deleteCancellationRequest(req, res, next) {
    try {
      await this.ensureCancellationTable();
      const userId = req.session.user.id;
      const requestId = Number(req.params.requestId);
      if (!Number.isFinite(requestId)) {
        this.setFlash(req, 'error', 'Invalid cancellation request.');
        res.redirect('/dashboard');
        return;
      }
      const result = await this.db.query(
        `
        DELETE FROM cancellation_requests
        WHERE cancellation_id = ? AND user_id = ? AND status = 'Pending'
        `,
        [requestId, userId]
      );
      this.setFlash(
        req,
        Number(result.affectedRows || 0) > 0 ? 'success' : 'error',
        Number(result.affectedRows || 0) > 0
          ? 'Cancellation request removed.'
          : 'Only pending requests can be deleted.'
      );
      res.redirect('/dashboard');
    } catch (err) {
      next(err);
    }
  }

  async updateAdminHotel(req, res, next) {
    try {
      const hotelId = Number(req.params.id);
      const name = String(req.body.name || '').trim();
      const city = String(req.body.city || '').trim();
      const country = String(req.body.country || '').trim();
      const address = String(req.body.address || '').trim();
      const rating = Number(req.body.rating);
      if (!Number.isFinite(hotelId) || !name || !city || !country || !address) {
        this.setFlash(req, 'error', 'Invalid hotel update data.');
        res.redirect('/admin');
        return;
      }
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        this.setFlash(req, 'error', 'Rating must be between 1 and 5.');
        res.redirect('/admin');
        return;
      }
      const updated = await this.hotelModel.updateHotelById(hotelId, { name, city, country, address, rating });
      this.setRowFlash(
        req,
        'hotel',
        hotelId,
        updated ? 'success' : 'error',
        updated ? 'Hotel updated.' : 'Update failed.'
      );
      this.setFlash(req, updated ? 'success' : 'error', updated ? 'Hotel updated successfully.' : 'Hotel update failed.');
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async updateAdminBooking(req, res, next) {
    try {
      const bookingId = Number(req.params.bookingId);
      const status = String(req.body.bookingStatus || '').trim();
      if (!Number.isFinite(bookingId) || !status) {
        this.setFlash(req, 'error', 'Invalid booking update request.');
        res.redirect('/admin');
        return;
      }

      const result = await this.db.query(
        `
        UPDATE bookings
        SET booking_status = ?
        WHERE booking_id = ?
        `,
        [status, bookingId]
      );
      const updated = Number(result.affectedRows || 0) > 0;
      this.setRowFlash(req, 'booking', bookingId, updated ? 'success' : 'error', updated ? 'Booking updated.' : 'Update failed.');
      this.setFlash(req, updated ? 'success' : 'error', updated ? 'Booking updated successfully.' : 'Booking update failed.');
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async deleteAdminBooking(req, res, next) {
    try {
      const bookingId = Number(req.params.bookingId);
      if (!Number.isFinite(bookingId)) {
        this.setFlash(req, 'error', 'Invalid booking id.');
        res.redirect('/admin');
        return;
      }

      const disputesRows = await this.db.query(
        'SELECT COUNT(*) AS total FROM disputes WHERE booking_id = ?',
        [bookingId]
      );
      if (Number(disputesRows[0]?.total || 0) > 0) {
        this.setRowFlash(req, 'booking', bookingId, 'error', 'Cannot delete booking with linked dispute(s).');
        this.setFlash(req, 'error', 'Booking cannot be deleted because disputes reference it.');
        res.redirect('/admin');
        return;
      }

      const result = await this.db.query('DELETE FROM bookings WHERE booking_id = ?', [bookingId]);
      const deleted = Number(result.affectedRows || 0) > 0;
      this.setRowFlash(req, 'booking', bookingId, deleted ? 'success' : 'error', deleted ? 'Booking removed.' : 'Delete failed.');
      this.setFlash(req, deleted ? 'success' : 'error', deleted ? 'Booking removed.' : 'Booking deletion failed.');
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async updateAdminCustomer(req, res, next) {
    try {
      const userId = Number(req.params.userId);
      const name = String(req.body.name || '').trim();
      const email = String(req.body.email || '').trim();
      if (!Number.isFinite(userId) || !name || !email) {
        this.setFlash(req, 'error', 'Invalid customer update details.');
        res.redirect('/admin');
        return;
      }
      const updated = await this.userModel.updateCustomerById(userId, { name, email });
      this.setRowFlash(req, 'customer', userId, updated ? 'success' : 'error', updated ? 'Customer updated.' : 'Update failed.');
      this.setFlash(req, updated ? 'success' : 'error', updated ? 'Customer updated successfully.' : 'Customer update failed.');
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async deleteAdminCustomer(req, res, next) {
    try {
      const userId = Number(req.params.userId);
      if (!Number.isFinite(userId)) {
        this.setFlash(req, 'error', 'Invalid customer id.');
        res.redirect('/admin');
        return;
      }
      const result = await this.userModel.deleteCustomerById(userId);
      if (!result.deleted && result.reason === 'has-dependencies') {
        this.setRowFlash(req, 'customer', userId, 'error', 'Cannot delete customer with related bookings/disputes.');
        this.setFlash(
          req,
          'error',
          `Cannot delete customer because of ${result.bookingsCount} booking(s) and ${result.disputesCount} dispute(s).`
        );
        res.redirect('/admin');
        return;
      }
      this.setRowFlash(req, 'customer', userId, result.deleted ? 'success' : 'error', result.deleted ? 'Customer removed.' : 'Delete failed.');
      this.setFlash(req, result.deleted ? 'success' : 'error', result.deleted ? 'Customer removed.' : 'Customer deletion failed.');
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async updateAdminDispute(req, res, next) {
    try {
      const disputeId = Number(req.params.disputeId);
      const statusInput = String(req.body.disputeStatus || '').trim().toLowerCase();
      const issue = String(req.body.issue || '').trim();
      const mappedStatus = statusInput === 'resolved' ? 'Resolved' : 'Pending';
      if (!Number.isFinite(disputeId) || !issue) {
        this.setFlash(req, 'error', 'Invalid dispute update details.');
        res.redirect('/admin');
        return;
      }
      const result = await this.db.query(
        `
        UPDATE disputes
        SET issue = ?, dispute_status = ?
        WHERE dispute_id = ?
        `,
        [issue, mappedStatus, disputeId]
      );
      this.setFlash(
        req,
        Number(result.affectedRows || 0) > 0 ? 'success' : 'error',
        Number(result.affectedRows || 0) > 0 ? 'Dispute updated successfully.' : 'Dispute update failed.'
      );
      this.setRowFlash(
        req,
        'dispute',
        disputeId,
        Number(result.affectedRows || 0) > 0 ? 'success' : 'error',
        Number(result.affectedRows || 0) > 0 ? 'Dispute updated.' : 'Update failed.'
      );
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async deleteAdminDispute(req, res, next) {
    try {
      const disputeId = Number(req.params.disputeId);
      if (!Number.isFinite(disputeId)) {
        this.setFlash(req, 'error', 'Invalid dispute id.');
        res.redirect('/admin');
        return;
      }
      const result = await this.db.query('DELETE FROM disputes WHERE dispute_id = ?', [disputeId]);
      this.setFlash(
        req,
        Number(result.affectedRows || 0) > 0 ? 'success' : 'error',
        Number(result.affectedRows || 0) > 0 ? 'Dispute removed.' : 'Dispute deletion failed.'
      );
      this.setRowFlash(
        req,
        'dispute',
        disputeId,
        Number(result.affectedRows || 0) > 0 ? 'success' : 'error',
        Number(result.affectedRows || 0) > 0 ? 'Dispute removed.' : 'Delete failed.'
      );
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }

  async reviewCancellationRequest(req, res, next) {
    try {
      await this.ensureCancellationTable();
      const requestId = Number(req.params.requestId);
      const action = String(req.body.action || '').trim().toLowerCase();
      const adminNotes = String(req.body.adminNotes || '').trim();
      if (!Number.isFinite(requestId) || !['approve', 'reject'].includes(action)) {
        this.setFlash(req, 'error', 'Invalid cancellation review request.');
        res.redirect('/admin');
        return;
      }

      const rows = await this.db.query(
        'SELECT booking_id AS bookingId, status FROM cancellation_requests WHERE cancellation_id = ? LIMIT 1',
        [requestId]
      );
      if (!rows.length || String(rows[0].status || '').toLowerCase() !== 'pending') {
        this.setFlash(req, 'error', 'Cancellation request not found or already reviewed.');
        res.redirect('/admin');
        return;
      }

      const nextStatus = action === 'approve' ? 'Approved' : 'Rejected';
      await this.db.query(
        `
        UPDATE cancellation_requests
        SET status = ?, admin_notes = ?
        WHERE cancellation_id = ?
        `,
        [nextStatus, adminNotes || null, requestId]
      );

      if (action === 'approve') {
        await this.db.query(
          `
          UPDATE bookings
          SET booking_status = 'Cancelled'
          WHERE booking_id = ?
          `,
          [rows[0].bookingId]
        );
      }

      this.setFlash(req, 'success', `Cancellation request ${action === 'approve' ? 'approved' : 'rejected'}.`);
      res.redirect('/admin');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DashboardController;
