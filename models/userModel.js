class UserModel {
  constructor({ db }) {
    this.db = db;
    this.schema = null;
  }

  async resolveSchema() {
    if (this.schema) return this.schema;

    const columns = await this.db.query('SHOW COLUMNS FROM users');
    const columnNames = new Set(columns.map((column) => column.Field));

    const isLegacy =
      columnNames.has('user_id') &&
      columnNames.has('first_name') &&
      columnNames.has('password_hash');

    if (!columnNames.has('role')) {
      await this.db.query(
        "ALTER TABLE users ADD COLUMN role VARCHAR(30) NOT NULL DEFAULT 'customer'"
      );
      columnNames.add('role');
    } else {
      await this.db.query(
        "ALTER TABLE users MODIFY COLUMN role VARCHAR(30) NOT NULL DEFAULT 'customer'"
      );
    }

    this.schema = {
      isLegacy,
      hasRole: true,
    };

    await this.ensureHotelOwnerTables();

    return this.schema;
  }

  async ensureHotelOwnerTables() {
    await this.db.query(
      `
      CREATE TABLE IF NOT EXISTS hotel_owner_requests (
        request_id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        hotel_name VARCHAR(150) NOT NULL,
        city VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        address VARCHAR(255) NOT NULL,
        rating DECIMAL(2,1) NOT NULL DEFAULT 4.0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        reviewed_by INT NULL,
        review_notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (request_id),
        UNIQUE KEY uniq_owner_request_user (user_id)
      )
      `
    );

    await this.db.query(
      `
      CREATE TABLE IF NOT EXISTS hotel_owners (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        hotel_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_owner_hotel (user_id, hotel_id)
      )
      `
    );
  }

  splitName(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || 'Guest';
    const lastName = parts.slice(1).join(' ') || '';
    return { firstName, lastName };
  }

  async createUser({ name, email, password, role = 'customer' }) {
    const schema = await this.resolveSchema();

    if (schema.isLegacy) {
      const { firstName, lastName } = this.splitName(name);
      const sql = schema.hasRole
        ? `
          INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        : `
          INSERT INTO users (first_name, last_name, email, phone, password_hash)
          VALUES (?, ?, ?, ?, ?)
        `;
      const params = schema.hasRole
        ? [firstName, lastName, email, null, password, role]
        : [firstName, lastName, email, null, password];

      const result = await this.db.query(sql, params);
      return result.insertId;
    }

    const result = await this.db.query(
      `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
      `,
      [name, email, password, role]
    );

    return result.insertId;
  }

  async findByEmail(email) {
    const schema = await this.resolveSchema();

    const sql = schema.isLegacy
      ? `
        SELECT
          user_id AS id,
          CONCAT(first_name, ' ', last_name) AS name,
          email,
          password_hash AS password,
          ${schema.hasRole ? 'role' : "'customer'"} AS role
        FROM users
        WHERE email = ?
        LIMIT 1
      `
      : `
        SELECT
          id,
          name,
          email,
          password,
          role
        FROM users
        WHERE email = ?
        LIMIT 1
      `;

    const rows = await this.db.query(sql, [email]);
    return rows[0] || null;
  }

  async findById(id) {
    const schema = await this.resolveSchema();

    const sql = schema.isLegacy
      ? `
        SELECT
          user_id AS id,
          CONCAT(first_name, ' ', last_name) AS name,
          email,
          ${schema.hasRole ? 'role' : "'customer'"} AS role
        FROM users
        WHERE user_id = ?
        LIMIT 1
      `
      : `
        SELECT id, name, email, role
        FROM users
        WHERE id = ?
        LIMIT 1
      `;

    const rows = await this.db.query(sql, [id]);
    return rows[0] || null;
  }

  async countUsers() {
    const rows = await this.db.query('SELECT COUNT(*) AS total FROM users');
    return Number(rows[0]?.total || 0);
  }

  async listRecentUsers(limit = 5) {
    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 50)) : 5;
    const schema = await this.resolveSchema();

    const sql = schema.isLegacy
      ? `
        SELECT
          user_id AS id,
          CONCAT(first_name, ' ', last_name) AS name,
          email,
          ${schema.hasRole ? 'role' : "'customer'"} AS role,
          created_at AS createdAt
        FROM users
        ORDER BY user_id DESC
        LIMIT ${safeLimit}
      `
      : `
        SELECT
          id,
          name,
          email,
          role,
          created_at AS createdAt
        FROM users
        ORDER BY id DESC
        LIMIT ${safeLimit}
      `;

    return this.db.query(sql);
  }

  async listCustomersForAdmin(limit = 20) {
    const parsedLimit = Number(limit);
    const safeLimit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 100)) : 20;
    const schema = await this.resolveSchema();

    const sql = schema.isLegacy
      ? `
        SELECT
          u.user_id AS id,
          CONCAT(u.first_name, ' ', u.last_name) AS name,
          u.email AS email,
          u.phone AS phone,
          ${schema.hasRole ? 'u.role' : "'customer'"} AS role,
          u.created_at AS createdAt,
          COUNT(b.booking_id) AS bookingsCount
        FROM users u
        LEFT JOIN bookings b ON b.user_id = u.user_id
        ${schema.hasRole ? "WHERE u.role = 'customer'" : ''}
        GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.phone, u.created_at${schema.hasRole ? ', u.role' : ''}
        ORDER BY u.user_id DESC
        LIMIT ${safeLimit}
      `
      : `
        SELECT
          u.id AS id,
          u.name AS name,
          u.email AS email,
          NULL AS phone,
          u.role AS role,
          u.created_at AS createdAt,
          COUNT(b.id) AS bookingsCount
        FROM users u
        LEFT JOIN bookings b ON b.user_id = u.id
        WHERE u.role = 'customer'
        GROUP BY u.id, u.name, u.email, u.role, u.created_at
        ORDER BY u.id DESC
        LIMIT ${safeLimit}
      `;

    const rows = await this.db.query(sql);
    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      email: row.email,
      phone: row.phone || 'N/A',
      role: row.role || 'customer',
      createdAt: row.createdAt,
      bookingsCount: Number(row.bookingsCount || 0),
    }));
  }

  async createHotelOwnerRequest({ userId, hotelName, city, country, address, rating }) {
    await this.resolveSchema();
    await this.db.query(
      `
      INSERT INTO hotel_owner_requests
        (user_id, hotel_name, city, country, address, rating, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
      ON DUPLICATE KEY UPDATE
        hotel_name = VALUES(hotel_name),
        city = VALUES(city),
        country = VALUES(country),
        address = VALUES(address),
        rating = VALUES(rating),
        status = 'pending',
        reviewed_by = NULL,
        review_notes = NULL,
        reviewed_at = NULL
      `,
      [userId, hotelName, city, country, address, rating]
    );
  }

  async getHotelOwnerRequestByEmail(email) {
    const schema = await this.resolveSchema();
    const userIdColumn = schema.isLegacy ? 'u.user_id' : 'u.id';

    const rows = await this.db.query(
      `
      SELECT
        r.request_id AS requestId,
        r.user_id AS userId,
        r.status AS status,
        r.hotel_name AS hotelName,
        r.city AS city,
        r.country AS country,
        r.address AS address,
        r.rating AS rating,
        r.review_notes AS reviewNotes
      FROM hotel_owner_requests r
      INNER JOIN users u ON ${userIdColumn} = r.user_id
      WHERE u.email = ?
      LIMIT 1
      `,
      [email]
    );

    return rows[0] || null;
  }

  async listPendingHotelOwnerRequests(limit = 20) {
    const schema = await this.resolveSchema();
    const userIdCol = schema.isLegacy ? 'u.user_id' : 'u.id';
    const fullNameCol = schema.isLegacy ? "CONCAT(u.first_name, ' ', u.last_name)" : 'u.name';

    const rows = await this.db.query(
      `
      SELECT
        r.request_id AS requestId,
        r.user_id AS userId,
        ${fullNameCol} AS userName,
        u.email AS email,
        r.hotel_name AS hotelName,
        r.city AS city,
        r.country AS country,
        r.address AS address,
        r.rating AS rating,
        r.status AS status,
        r.created_at AS createdAt
      FROM hotel_owner_requests r
      INNER JOIN users u ON ${userIdCol} = r.user_id
      WHERE r.status = 'pending'
      ORDER BY r.request_id ASC
      LIMIT ${Math.max(1, Math.min(Number(limit) || 20, 100))}
      `
    );

    return rows.map((row) => ({
      requestId: Number(row.requestId),
      userId: Number(row.userId),
      userName: row.userName,
      email: row.email,
      hotelName: row.hotelName,
      city: row.city,
      country: row.country,
      address: row.address,
      rating: Number(row.rating),
      status: row.status,
      createdAt: row.createdAt,
    }));
  }

  async getHotelOwnerRequestById(requestId) {
    await this.resolveSchema();
    const rows = await this.db.query(
      `
      SELECT
        request_id AS requestId,
        user_id AS userId,
        hotel_name AS hotelName,
        city,
        country,
        address,
        rating,
        status
      FROM hotel_owner_requests
      WHERE request_id = ?
      LIMIT 1
      `,
      [requestId]
    );
    return rows[0] || null;
  }

  async setUserRole(userId, role) {
    const schema = await this.resolveSchema();
    const userIdCol = schema.isLegacy ? 'user_id' : 'id';
    await this.db.query(`UPDATE users SET role = ? WHERE ${userIdCol} = ?`, [role, userId]);
  }

  async updateHotelOwnerRequestStatus({ requestId, status, reviewedBy = null, reviewNotes = null }) {
    await this.resolveSchema();
    await this.db.query(
      `
      UPDATE hotel_owner_requests
      SET
        status = ?,
        reviewed_by = ?,
        review_notes = ?,
        reviewed_at = NOW()
      WHERE request_id = ?
      `,
      [status, reviewedBy, reviewNotes, requestId]
    );
  }

  async attachOwnerToHotel({ userId, hotelId }) {
    await this.resolveSchema();
    await this.db.query(
      `
      INSERT INTO hotel_owners (user_id, hotel_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)
      `,
      [userId, hotelId]
    );
  }
}

module.exports = UserModel;
