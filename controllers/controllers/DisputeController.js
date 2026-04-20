class DisputeController {
  constructor({ db }) {
    this.db = db;

    this.index = this.index.bind(this);
    this.create = this.create.bind(this);
  }

  formatDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
      return new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  extractNumericBookingId(rawBookingId) {
    const match = String(rawBookingId || "").trim().match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  mapDbDisputeToView(dispute) {
    return {
      bookingId: `HTL-${dispute.bookingId}`,
      issueType: dispute.issueType || "other",
      description: dispute.description || dispute.issue,
      status: String(dispute.status || "Open").toLowerCase(),
      date: this.formatDate(dispute.createdAt),
    };
  }

  // GET /disputes
  async index(req, res, next) {
    try {
      const userId = req.session.user.id;
      const rows = await this.db.query(
        `
        SELECT
          d.dispute_id AS id,
          d.booking_id AS bookingId,
          d.issue AS issue,
          d.dispute_status AS status,
          d.created_at AS createdAt
        FROM disputes d
        WHERE d.user_id = ?
        ORDER BY d.dispute_id DESC
        `,
        [userId]
      );

      const disputes = rows.map((row) => {
        const [issueTypePart, ...descriptionParts] = String(row.issue || "").split(":");
        return this.mapDbDisputeToView({
          ...row,
          issueType: issueTypePart || "other",
          description: descriptionParts.join(":").trim() || row.issue,
        });
      });

      res.render("booking_dispute", {
        title: "Booking Disputes - HotelEase",
        disputes,
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /disputes
  async create(req, res, next) {
    try {
      const userId = req.session.user.id;
      const bookingId = this.extractNumericBookingId(req.body.bookingId);
      const issueType = String(req.body.issueType || "").trim();
      const description = String(req.body.description || "").trim();

      if (!bookingId || !issueType || !description) {
        req.session.flash = {
          type: "error",
          message: "Booking ID, issue type, and description are required.",
        };
        res.redirect("/disputes");
        return;
      }

      const bookingRows = await this.db.query(
        `
        SELECT booking_id
        FROM bookings
        WHERE booking_id = ? AND user_id = ?
        LIMIT 1
        `,
        [bookingId, userId]
      );

      if (!bookingRows.length) {
        req.session.flash = {
          type: "error",
          message: "Booking not found for your account.",
        };
        res.redirect("/disputes");
        return;
      }

      const issue = `${issueType}: ${description}`;
      await this.db.query(
        `
        INSERT INTO disputes (booking_id, user_id, issue, dispute_status)
        VALUES (?, ?, ?, ?)
        `,
        [bookingId, userId, issue, "Open"]
      );

      req.session.flash = {
        type: "success",
        message: "Dispute submitted successfully. Our team will review it shortly.",
      };
      res.redirect("/disputes");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DisputeController;