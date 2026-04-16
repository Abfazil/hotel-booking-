class ReviewModel {
  constructor({ pool } = {}) {
    this.pool = pool || null;
  }
 
  /**
   *reviews for a specific hotel, joined with reviewer name
   *from hotelController.detail() so reviews appear on the hotel page
   *
   * @param {number} hotelId
   * @param {number} limit
   */
  async getReviewsByHotel(hotelId, limit = 9) {
    if (!this.pool) return this._fallback().slice(0, limit);
 
    try {
      const rows = await this.pool.query(
        `
        SELECT
          r.review_id,
          r.rating,
          r.comment,
          r.review_date,
          u.first_name,
          u.last_name,
          h.hotel_name AS hotel_name,
          CONCAT(h.city, ', ', h.country) AS location
        FROM reviews r
        JOIN users u ON u.user_id = r.user_id
        JOIN hotels h ON h.hotel_id = r.hotel_id
        WHERE r.hotel_id = ?
        ORDER BY r.review_date DESC
        LIMIT ?
        `,
        [hotelId, limit]
      );
 
      if (!rows || rows.length === 0) return [];
 
      return rows.map((r) => ({
        review_id: r.review_id,
        rating: Number(r.rating),
        comment: r.comment || '',
        review_date: r.review_date,
        name: `${r.first_name} ${r.last_name}`,
        hotel_name: r.hotel_name,
        location: r.location,
      }));
    } catch {
      return this._fallback().slice(0, limit);
    }
  }
 
  /**
   * Latest reviews across all hotels.
   * Used by the (optional) `/reviews` page.
   *
   * @param {number} limit
   */
  async getRecentReviews(limit = 9) {
    if (!this.pool) return this._fallback().slice(0, limit);

    try {
      const rows = await this.pool.query(
        `
        SELECT
          r.review_id,
          r.rating,
          r.comment,
          r.review_date,
          u.first_name,
          u.last_name,
          h.hotel_name AS hotel_name,
          CONCAT(h.city, ', ', h.country) AS location
        FROM reviews r
        JOIN users u ON u.user_id = r.user_id
        JOIN hotels h ON h.hotel_id = r.hotel_id
        ORDER BY r.review_date DESC
        LIMIT ?
        `,
        [limit]
      );

      if (!rows || rows.length === 0) return [];

      return rows.map((r) => ({
        review_id: r.review_id,
        rating: Number(r.rating),
        comment: r.comment || '',
        review_date: r.review_date,
        name: `${r.first_name} ${r.last_name}`,
        hotel_name: r.hotel_name,
        location: r.location,
      }));
    } catch {
      return this._fallback().slice(0, limit);
    }
  }

  /**
   * Shown when DB is unavailable — same defensive pattern as hotelModel.
   */
  _fallback() {
    return [
      {
        review_id: 1,
        rating: 5,
        comment: 'Amazing stay, everything was perfect.',
        name: 'John Smith',
        review_date: '2026-04-04',
        hotel_name: 'Grand Palace Hotel',
        location: 'London, UK',
      },
      {
        review_id: 2,
        rating: 4,
        comment: 'Great service and beautiful surroundings.',
        name: 'Emma Brown',
        review_date: '2026-04-06',
        hotel_name: 'Sea View Resort',
        location: 'Barcelona, Spain',
      },
      {
        review_id: 3,
        rating: 5,
        comment: 'Breathtaking location, highly recommend.',
        name: 'Liam Wilson',
        review_date: '2026-04-07',
        hotel_name: 'Mountain Lodge',
        location: 'Zurich, Switzerland',
      },
      {
        review_id: 4,
        rating: 4,
        comment: 'Really nice hotel, would come back.',
        name: 'Olivia Taylor',
        review_date: '2026-04-12',
        hotel_name: 'Royal Gardens Hotel',
        location: 'Paris, France',
      },
      {
        review_id: 5,
        rating: 3,
        comment: 'Decent stay, room was a bit small.',
        name: 'Noah Anderson',
        review_date: '2026-04-13',
        hotel_name: 'City Central Hotel',
        location: 'New York, USA',
      },
      {
        review_id: 6,
        rating: 5,
        comment: 'Pure luxury, best holiday we have had.',
        name: 'Ava Thomas',
        review_date: '2026-04-16',
        hotel_name: 'Sunset Paradise',
        location: 'Maldives, Maldives',
      },
    ];
  }
}
 
module.exports = ReviewModel;














































