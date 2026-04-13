class DisputeController {
    constructor() {
      this.index = this.index.bind(this);
      this.create = this.create.bind(this);
  
      // temporary in-memory storage (later replace with DB)
      this.disputes = [
        {
          bookingId: "HTL-123456",
          issueType: "Room not as described",
          description: "The room was much smaller than shown in photos.",
          status: "pending",
          date: "12 Apr 2026"
        }
      ];
    }
  
    // GET /disputes
    index(req, res, next) {
      try {
        res.render("booking_dispute", {
          title: "Booking Disputes — HotelEase",
          disputes: this.disputes
        });
      } catch (err) {
        next(err);
      }
    }
  
    // POST /disputes
    create(req, res, next) {
      try {
        const { bookingId, issueType, description } = req.body;
  
        const newDispute = {
          bookingId,
          issueType,
          description,
          status: "pending",
          date: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })
        };
  
        this.disputes.unshift(newDispute);
  
        res.redirect("/disputes");
      } catch (err) {
        next(err);
      }
    }
  }
  
  module.exports = DisputeController;