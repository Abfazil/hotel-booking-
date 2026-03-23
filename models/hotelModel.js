
class HotelModel {
  constructor({ pool } = {}) {
    this.pool = pool || null;
    
    this._initPromise = null;
  }

  getHotelImageUrl(id, width = 800, height = 600) {
    // Use only locally stored hotel images (no random external images).
    // If your `hotels` table doesn't store an `image`, we still return a valid
    // "hotel-like" image from this set.
    const safeId = Number.isFinite(Number(id)) && Number(id) > 0 ? Number(id) : 1;
    const idx = (safeId - 1) % 4;

    if (idx === 0) return '/images/homepage_image.webp';
    if (idx === 1) return '/images/why_choose_us.jpg';
    if (idx === 2) return '/images/gallery_01.jpg';
    return '/images/gallery_02.jpg';
  }

  hotelFromId(id) {
    const safeId = Number.isFinite(id) ? id : 1;
    const index = (Math.max(1, safeId) - 1) % this.baseHotels.length;
    return this.baseHotels[index];
  }

  generateHotels(count, startId = 1) {
    const safeCount = Math.max(0, Number(count) || 0);
    const safeStart = Number.isFinite(startId) ? Number(startId) : 1;

    return Array.from({ length: safeCount }, (_, i) => {
      const id = safeStart + i;
      const base = this.hotelFromId(id);

      const price = Number(base.price) + ((id % 5) * 1.25);
      const rating = Number(base.rating) - ((id % 3) * 0.05);

      return {
        id,
        name: base.name,
        price,
        rating,
        location: base.location,
        image: this.getHotelImageUrl(id),
      };
    });
  }

  async getHotels(count) {
    const safeCount = Math.max(0, Number(count) || 0);
    if (safeCount === 0) return [];

    if (!this.pool) return this.generateHotels(safeCount, 1);

    try {
      await this.init();

      const rows = await this.pool.query(
        `
        SELECT
          h.hotel_id AS id,
          h.hotel_name AS name,
          CONCAT(h.city, ', ', h.country) AS location,
          COALESCE(MIN(r.price_per_night), 0) AS price,
          h.rating AS rating,
          NULL AS image
        FROM hotels h
        LEFT JOIN rooms r ON r.hotel_id = h.hotel_id
        GROUP BY h.hotel_id, h.hotel_name, h.city, h.country, h.rating
        ORDER BY h.hotel_id ASC
        LIMIT ?
        `,
        [safeCount]
      );

      if (!rows || rows.length === 0) return this.generateHotels(safeCount);

      const normalized = rows.map((h) => ({
        id: Number(h.id),
        name: h.name,
        price: Number(h.price),
        rating: Number(h.rating),
        location: h.location,
        image: this.getHotelImageUrl(Number(h.id)),
      }));

      if (normalized.length < safeCount) {
        const extra = this.generateHotels(safeCount - normalized.length, normalized.length + 1);
        return [...normalized, ...extra];
      }

      return normalized;
    } catch (err) {
      return this.generateHotels(safeCount, 1);
    }
  }

  async getHotelById(id) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) return null;
    if (!this.pool) {
      return this.generateHotels(1, numericId)[0];
    }

    try {
      await this.init();

      const rows = await this.pool.query(
        `
        SELECT
          h.hotel_id AS id,
          h.hotel_name AS name,
          CONCAT(h.city, ', ', h.country) AS location,
          COALESCE(MIN(r.price_per_night), 0) AS price,
          h.rating AS rating,
          NULL AS image
        FROM hotels h
        LEFT JOIN rooms r ON r.hotel_id = h.hotel_id
        WHERE h.hotel_id = ?
        GROUP BY h.hotel_id, h.hotel_name, h.city, h.country, h.rating
        LIMIT 1
        `,
        [numericId]
      );

      if (rows && rows.length) {
        const h = rows[0];
        return {
          id: Number(h.id),
          name: h.name,
          price: Number(h.price),
          rating: Number(h.rating),
          location: h.location,
          image: this.getHotelImageUrl(Number(h.id)),
        };
      }

      return this.generateHotels(1, numericId)[0];
    } catch (err) {
      return this.generateHotels(1, numericId)[0];
    }

  }

  async init() {
    return true;
  }
}

module.exports = HotelModel;

