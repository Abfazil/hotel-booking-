class HotelModel {
  constructor({ pool } = {}) {
    this.pool = pool || null;
  }

  getHotelImageUrl(id) {
    const safeId = Number.isFinite(Number(id)) ? Number(id) : 1;
    const idx = (safeId - 1) % 4;

    if (idx === 0) return "/images/homepage_image.webp";
    if (idx === 1) return "/images/why_choose_us.jpg";
    if (idx === 2) return "/images/gallery_01.jpg";
    return "/images/gallery_02.jpg";
  }

  async init() {
    return true;
  }

  async getHotels() {
    if (!this.pool) {
      throw new Error("Database not connected");
    }

    await this.init();

    const rows = await this.pool.query(
      `
      SELECT
        h.hotel_id AS id,
        h.hotel_name AS name,
        CONCAT(h.city, ', ', h.country) AS location,
        COALESCE(MIN(r.price_per_night), 0) AS price,
        h.rating AS rating
      FROM hotels h
      LEFT JOIN rooms r ON r.hotel_id = h.hotel_id
      GROUP BY h.hotel_id, h.hotel_name, h.city, h.country, h.rating
      ORDER BY h.hotel_id ASC
      `,
    );

    return rows.map(h => ({
      id: Number(h.id),
      name: h.name,
      price: Number(h.price),
      rating: Number(h.rating),
      location: h.location,
      image: this.getHotelImageUrl(h.id),
    }));
  }

  async getHotelById(id) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return null;

    if (!this.pool) {
      throw new Error("Database not connected");
    }

    await this.init();

    const rows = await this.pool.query(
      `
      SELECT
        h.hotel_id AS id,
        h.hotel_name AS name,
        CONCAT(h.city, ', ', h.country) AS location,
        COALESCE(MIN(r.price_per_night), 0) AS price,
        h.rating AS rating
      FROM hotels h
      LEFT JOIN rooms r ON r.hotel_id = h.hotel_id
      WHERE h.hotel_id = ?
      GROUP BY h.hotel_id, h.hotel_name, h.city, h.country, h.rating
      LIMIT 1
      `,
      [numericId]
    );

    if (!rows.length) return null;

    const h = rows[0];

    return {
      id: Number(h.id),
      name: h.name,
      price: Number(h.price),
      rating: Number(h.rating),
      location: h.location,
      image: this.getHotelImageUrl(h.id),
    };
  }
}

module.exports = HotelModel;

