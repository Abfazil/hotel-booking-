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

    this.schema = {
      isLegacy,
      hasRole: columnNames.has('role'),
    };

    return this.schema;
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
}

module.exports = UserModel;
