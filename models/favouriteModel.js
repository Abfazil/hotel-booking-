class FavouriteModel {
  constructor({ db, hotelModel } = {}) {
    this.db = db;
    this.hotelModel = hotelModel || null;
    this._didInit = false;
  }

  async init() {
    if (this._didInit) return true;
    if (!this.db) throw new Error('Database not connected');

    await this.db.query(
      `
      CREATE TABLE IF NOT EXISTS favourites (
        user_id INT NOT NULL,
        hotel_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, hotel_id),
        INDEX idx_favourites_user (user_id),
        INDEX idx_favourites_hotel (hotel_id)
      )
      `
    );

    this._didInit = true;
    return true;
  }

  attachImages(hotels = []) {
    if (!this.hotelModel || typeof this.hotelModel.getHotelImageUrl !== 'function') return hotels;
    return hotels.map((h) => ({ ...h, image: this.hotelModel.getHotelImageUrl(h.id) }));
  }

  async toggle(userId, hotelId) {
    await this.init();

    const parsedUserId = Number(userId);
    const parsedHotelId = Number(hotelId);
    if (!Number.isFinite(parsedUserId) || !Number.isFinite(parsedHotelId)) {
      throw new Error('Invalid favourite toggle parameters');
    }

    const existing = await this.db.query(
      `
      SELECT 1
      FROM favourites
      WHERE user_id = ? AND hotel_id = ?
      LIMIT 1
      `,
      [parsedUserId, parsedHotelId]
    );

    if (existing.length) {
      await this.db.query(
        `
        DELETE FROM favourites
        WHERE user_id = ? AND hotel_id = ?
        `,
        [parsedUserId, parsedHotelId]
      );
      return { isFavourite: false };
    }

    await this.db.query(
      `
      INSERT IGNORE INTO favourites (user_id, hotel_id)
      VALUES (?, ?)
      `,
      [parsedUserId, parsedHotelId]
    );
    return { isFavourite: true };
  }

  async listByUser(userId) {
    await this.init();

    const parsedUserId = Number(userId);
    if (!Number.isFinite(parsedUserId)) return [];

    const rows = await this.db.query(
      `
      SELECT
        h.hotel_id AS id,
        h.hotel_name AS name,
        CONCAT(h.city, ', ', h.country) AS location,
        COALESCE(MIN(r.price_per_night), 0) AS price,
        h.rating AS rating,
        MAX(f.created_at) AS favourited_at
      FROM favourites f
      JOIN hotels h ON h.hotel_id = f.hotel_id
      LEFT JOIN rooms r ON r.hotel_id = h.hotel_id
      WHERE f.user_id = ?
      GROUP BY h.hotel_id, h.hotel_name, h.city, h.country, h.rating
      ORDER BY favourited_at DESC
      `,
      [parsedUserId]
    );

    const hotels = rows.map((h) => ({
      id: Number(h.id),
      name: h.name,
      price: Number(h.price),
      rating: Number(h.rating),
      location: h.location,
      isFavourite: true,
    }));

    return this.attachImages(hotels);
  }
}

module.exports = FavouriteModel;

