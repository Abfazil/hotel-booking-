class HotelModel {
  constructor({ pool } = {}) {
    this.pool = pool || null;
  }

  getFallbackHotelImageUrl(id) {
    const safeId = Number.isFinite(Number(id)) ? Number(id) : 1;
    const idx = (safeId - 1) % 4;

    if (idx === 0) return '/images/homepage_image.webp';
    if (idx === 1) return '/images/why_choose_us.jpg';
    if (idx === 2) return '/images/gallery_01.jpg';
    return '/images/gallery_02.jpg';
  }

  async init() {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    await this.pool.query(
      `
      CREATE TABLE IF NOT EXISTS hotel_images (
        image_id INT NOT NULL AUTO_INCREMENT,
        hotel_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        PRIMARY KEY (image_id),
        KEY hotel_id (hotel_id),
        CONSTRAINT hotel_images_ibfk_1
          FOREIGN KEY (hotel_id) REFERENCES hotels (hotel_id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `
    );

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
        h.rating AS rating,
        MIN(hi.image_url) AS image
      FROM hotels h
      LEFT JOIN rooms r ON r.hotel_id = h.hotel_id
      LEFT JOIN hotel_images hi ON hi.hotel_id = h.hotel_id
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
      image: h.image || this.getFallbackHotelImageUrl(h.id),
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
        h.address AS address,
        COALESCE(MIN(r.price_per_night), 0) AS price,
        h.rating AS rating,
        MIN(hi.image_url) AS image
      FROM hotels h
      LEFT JOIN rooms r ON r.hotel_id = h.hotel_id
      LEFT JOIN hotel_images hi ON hi.hotel_id = h.hotel_id
      WHERE h.hotel_id = ?
      GROUP BY h.hotel_id, h.hotel_name, h.city, h.country, h.address, h.rating
      LIMIT 1
      `,
      [numericId]
    );

    if (!rows.length) return null;

    const h = rows[0];
    const roomRows = await this.pool.query(
      `
      SELECT
        room_id AS id,
        room_type AS type,
        price_per_night AS pricePerNight,
        capacity,
        available
      FROM rooms
      WHERE hotel_id = ?
      ORDER BY room_id ASC
      `,
      [numericId]
    );
    const imageRows = await this.pool.query(
      `
      SELECT image_url AS imageUrl
      FROM hotel_images
      WHERE hotel_id = ?
      ORDER BY sort_order ASC, image_id ASC
      `,
      [numericId]
    );

    return {
      id: Number(h.id),
      name: h.name,
      price: Number(h.price),
      rating: Number(h.rating),
      location: h.location,
      address: h.address,
      image: h.image || this.getFallbackHotelImageUrl(h.id),
      images: imageRows.map((row) => row.imageUrl),
      rooms: roomRows.map((row) => ({
        id: Number(row.id),
        type: row.type,
        pricePerNight: Number(row.pricePerNight),
        capacity: Number(row.capacity),
        available: Boolean(row.available),
      })),
    };
  }

  async getHotelsForAdmin() {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    await this.init();

    const rows = await this.pool.query(
      `
      SELECT
        h.hotel_id AS id,
        h.hotel_name AS name,
        h.city AS city,
        h.country AS country,
        h.address AS address,
        h.rating AS rating,
        COUNT(r.room_id) AS roomsCount,
        MIN(hi.image_url) AS image
      FROM hotels h
      LEFT JOIN rooms r ON r.hotel_id = h.hotel_id
      LEFT JOIN hotel_images hi ON hi.hotel_id = h.hotel_id
      GROUP BY h.hotel_id, h.hotel_name, h.city, h.country, h.address, h.rating
      ORDER BY h.hotel_id DESC
      `
    );

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      city: row.city,
      country: row.country,
      address: row.address,
      rating: Number(row.rating),
      roomsCount: Number(row.roomsCount || 0),
      image: row.image || this.getFallbackHotelImageUrl(row.id),
    }));
  }

  async createHotel({ name, city, country, address, rating, rooms, images }) {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    await this.init();

    let hotelId = null;
    try {
      const hotelResult = await this.pool.query(
        `
        INSERT INTO hotels (hotel_name, city, country, address, rating)
        VALUES (?, ?, ?, ?, ?)
        `,
        [name, city, country, address, rating]
      );
      hotelId = Number(hotelResult.insertId);

      for (const room of rooms) {
        await this.pool.query(
          `
          INSERT INTO rooms (hotel_id, room_type, price_per_night, capacity, available)
          VALUES (?, ?, ?, ?, ?)
          `,
          [hotelId, room.roomType, room.pricePerNight, room.capacity, room.available]
        );
      }

      for (let idx = 0; idx < images.length; idx += 1) {
        await this.pool.query(
          `
          INSERT INTO hotel_images (hotel_id, image_url, sort_order)
          VALUES (?, ?, ?)
          `,
          [hotelId, images[idx], idx]
        );
      }
    } catch (err) {
      if (hotelId) {
        await this.pool.query('DELETE FROM hotel_images WHERE hotel_id = ?', [hotelId]);
        await this.pool.query('DELETE FROM rooms WHERE hotel_id = ?', [hotelId]);
        await this.pool.query('DELETE FROM hotels WHERE hotel_id = ?', [hotelId]);
      }
      throw err;
    }

    return hotelId;
  }

  async canDeleteHotel(hotelId) {
    const reviewRows = await this.pool.query(
      'SELECT COUNT(*) AS total FROM reviews WHERE hotel_id = ?',
      [hotelId]
    );
    const bookingRows = await this.pool.query(
      `
      SELECT COUNT(*) AS total
      FROM bookings b
      INNER JOIN rooms r ON r.room_id = b.room_id
      WHERE r.hotel_id = ?
      `,
      [hotelId]
    );

    return {
      canDelete: Number(reviewRows[0]?.total || 0) === 0 && Number(bookingRows[0]?.total || 0) === 0,
      reviewsCount: Number(reviewRows[0]?.total || 0),
      bookingsCount: Number(bookingRows[0]?.total || 0),
    };
  }

  async deleteHotelById(id) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      return { deleted: false, reason: 'invalid-id' };
    }

    if (!this.pool) {
      throw new Error('Database not connected');
    }

    await this.init();

    const dependencies = await this.canDeleteHotel(numericId);
    if (!dependencies.canDelete) {
      return {
        deleted: false,
        reason: 'has-dependencies',
        ...dependencies,
      };
    }

    await this.pool.query('DELETE FROM hotel_images WHERE hotel_id = ?', [numericId]);
    await this.pool.query('DELETE FROM rooms WHERE hotel_id = ?', [numericId]);
    const result = await this.pool.query('DELETE FROM hotels WHERE hotel_id = ?', [numericId]);

    return { deleted: Number(result.affectedRows || 0) > 0 };
  }
}

module.exports = HotelModel;

