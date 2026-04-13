class HotelController {
  constructor({ hotelModel }) {
    this.hotelModel = hotelModel;

    this.home = this.home.bind(this);
    this.list = this.list.bind(this);
    this.detail = this.detail.bind(this);
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

      res.render('hotel-detail', {
        title: `Stay at ${hotel.name} — HotelEase`,
        hotel,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = HotelController;

