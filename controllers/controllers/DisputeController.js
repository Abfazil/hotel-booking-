const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

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

  async saveEvidenceImage(evidenceData, evidenceName) {
    const rawData = String(evidenceData || "").trim();
    if (!rawData) {
      return null;
    }

    const match = rawData.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i);
    if (!match) {
      return null;
    }

    const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
    const base64Payload = match[2];
    const buffer = Buffer.from(base64Payload, "base64");

    // Keep upload size bounded to prevent overly large payloads.
    const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
    if (!buffer.length || buffer.length > MAX_IMAGE_SIZE_BYTES) {
      return null;
    }

    const safeName = String(evidenceName || "evidence")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 32) || "evidence";
    const filename = `${safeName}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
    const destinationDir = path.join(process.cwd(), "public", "images");
    const destinationPath = path.join(destinationDir, filename);

    await fs.mkdir(destinationDir, { recursive: true });
    await fs.writeFile(destinationPath, buffer);

    return filename;
  }

  mapDbDisputeToView(dispute) {
    const normalizedStatus = String(dispute.status || "Pending").toLowerCase();
    return {
      bookingId: `HTL-${dispute.bookingId}`,
      issueType: dispute.issueType || "other",
      description: dispute.description || dispute.issue,
      status: normalizedStatus,
      statusLabel: normalizedStatus === "resolved" ? "resolved" : "pending",
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

      const customerBookings = await this.db.query(
        `
        SELECT
          b.booking_id AS id,
          h.hotel_name AS hotelName,
          b.booking_status AS bookingStatus
        FROM bookings b
        LEFT JOIN rooms r ON r.room_id = b.room_id
        LEFT JOIN hotels h ON h.hotel_id = r.hotel_id
        WHERE b.user_id = ?
        ORDER BY b.booking_id DESC
        LIMIT 50
        `,
        [userId]
      );

      res.render("booking_dispute", {
        title: "Booking Disputes - HotelEase",
        disputes,
        customerBookings,
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
      const evidenceData = req.body.evidenceData;
      const evidenceName = req.body.evidenceName;

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

      const savedEvidenceFilename = await this.saveEvidenceImage(evidenceData, evidenceName);
      const issueEvidenceSuffix = savedEvidenceFilename
        ? ` [evidence: /images/${savedEvidenceFilename}]`
        : "";
      const issue = `${issueType}: ${description}${issueEvidenceSuffix}`;
      await this.db.query(
        `
        INSERT INTO disputes (booking_id, user_id, issue, dispute_status)
        VALUES (?, ?, ?, ?)
        `,
        [bookingId, userId, issue, "Pending"]
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