class HotelController {
  constructor({ hotelModel, db, reviewModel }) {
    this.hotelModel = hotelModel;
    this.db = db;
    this.reviewModel = reviewModel;

    this.home = this.home.bind(this);
    this.list = this.list.bind(this);
    this.detail = this.detail.bind(this);
    this.bookHotel = this.bookHotel.bind(this);
    this.thankYou = this.thankYou.bind(this);
  }

  async home(req, res, next) {
    try {
      const hotels = await this.hotelModel.getHotels();
      res.render('index', {
        title: 'HotelEase — Find Your Perfect Stay',
        hotels,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const hotels = await this.hotelModel.getHotels();
      res.render('hotels-list', {
        title: 'All Hotels — HotelEase',
        hotels,
      });
    } catch (err) {
      next(err);
    }
  }

  async detail(req, res, next) {
    try {
      const id = Number(req.params.id);
      const hotel = await this.hotelModel.getHotelById(id);

      if (!hotel) {
        res.status(404).send('Hotel not found');
        return;
      }

      const reviews =
        this.reviewModel && typeof this.reviewModel.getReviewsByHotel === 'function'
          ? await this.reviewModel.getReviewsByHotel(id, 9)
          : [];

      res.render('hotel-detail', {
        title: `Stay at ${hotel.name} — HotelEase`,
        hotel,
        reviews,
      });
    } catch (err) {
      next(err);
    }
  }

  async bookHotel(req, res, next) {
    try {
      const id = Number(req.params.id);
      const hotel = await this.hotelModel.getHotelById(id);

      if (!hotel) {
        res.status(404).send('Hotel not found');
        return;
      }

      const customerName = req.session?.user?.name || 'Guest';
      const userId = req.session?.user?.id;
      const checkInDate = req.body.checkInDate;
      const nights = Number.parseInt(req.body.nights, 10);
      const days = Number.parseInt(req.body.days, 10);
      const guests = Number.parseInt(req.body.guests, 10);

      const safeNights = Number.isFinite(nights) && nights > 0 ? nights : 1;
      const safeDays = Number.isFinite(days) && days > 0 ? days : safeNights + 1;
      const safeGuests = Number.isFinite(guests) && guests > 0 ? guests : 1;
      const mealPlan = req.body.mealPlan || 'Breakfast only';
      const roomType = req.body.roomType || 'Standard room';
      const paymentMethod = req.body.paymentMethod || 'Pay at hotel';
      const specialRequests = req.body.specialRequests || 'None';
      const parsedCheckIn = checkInDate ? new Date(checkInDate) : null;
      const hasValidCheckIn = parsedCheckIn instanceof Date && !Number.isNaN(parsedCheckIn.getTime());

      if (!userId || !hasValidCheckIn) {
        res.status(400).send('Missing booking information');
        return;
      }

      const matchingRooms = await this.db.query(
        `
        SELECT room_id, room_type, price_per_night
        FROM rooms
        WHERE hotel_id = ? AND available = 1
        ORDER BY
          CASE
            WHEN ? = 'Suite' AND room_type IN ('Suite', 'Villa') THEN 0
            WHEN ? = 'Deluxe room' AND room_type IN ('Double', 'Suite') THEN 0
            WHEN ? = 'Standard room' AND room_type IN ('Single', 'Double') THEN 0
            ELSE 1
          END,
          CASE WHEN capacity >= ? THEN 0 ELSE 1 END,
          price_per_night ASC
        LIMIT 1
        `,
        [id, roomType, roomType, roomType, safeGuests]
      );

      if (!matchingRooms.length) {
        res.status(400).send('No rooms available for this hotel right now');
        return;
      }

      const selectedRoom = matchingRooms[0];
      const checkOut = new Date(parsedCheckIn);
      checkOut.setDate(checkOut.getDate() + safeNights);
      const checkOutDate = checkOut.toISOString().slice(0, 10);
      const roomPrice = Number(selectedRoom.price_per_night || hotel.price || 0);
      const totalCost = roomPrice * safeNights;

      await this.db.query(
        `
        INSERT INTO bookings (user_id, room_id, check_in, check_out, total_price, booking_status)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [userId, selectedRoom.room_id, checkInDate, checkOutDate, totalCost, 'Confirmed']
      );

      const bookingSummary = {
        hotelName: hotel.name,
        location: hotel.location,
        price: roomPrice,
        nights: safeNights,
        days: safeDays,
        guests: safeGuests,
        checkInDate,
        checkOutDate,
        mealPlan,
        roomType: selectedRoom.room_type || roomType,
        paymentMethod,
        specialRequests,
        totalCost,
        customerName,
      };
      req.session.lastBooking = bookingSummary;
      req.session.recentBooking = bookingSummary;

      res.redirect('/thank-you');
    } catch (err) {
      next(err);
    }
  }

  thankYou(req, res) {
    const booking = req.session.lastBooking;

    if (!booking) {
      res.redirect('/hotels');
      return;
    }

    delete req.session.lastBooking;
    res.render('thank-you', {
      title: 'Thank You For Booking — HotelEase',
      booking,
    });
  }
}

module.exports = HotelController;

