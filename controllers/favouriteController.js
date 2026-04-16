class FavouriteController {
  constructor({ favouriteModel } = {}) {
    this.favouriteModel = favouriteModel;

    this.list = this.list.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  async list(req, res, next) {
    try {
      const userId = req.session?.user?.id;
      const hotels = await this.favouriteModel.listByUser(userId);

      res.render('favourites', {
        title: 'Your Favourites — HotelEase',
        hotels,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggle(req, res, next) {
    try {
      const userId = req.session?.user?.id;
      const hotelId = Number(req.params.hotelId);

      const result = await this.favouriteModel.toggle(userId, hotelId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = FavouriteController;

