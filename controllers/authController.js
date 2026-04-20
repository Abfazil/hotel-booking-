const bcrypt = require('bcrypt');

class AuthController {
  constructor({ userModel }) {
    this.userModel = userModel;

    this.showRegister = this.showRegister.bind(this);
    this.register = this.register.bind(this);
    this.showLogin = this.showLogin.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
  }

  showRegister(req, res) {
    res.render('auth/register', {
      title: 'Create Account — HotelEase',
      flash: res.locals.flash || null,
      formData: { accountType: 'customer' },
    });
  }

  async register(req, res, next) {
    try {
      const name = String(req.body.name || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');
      const accountType = String(req.body.accountType || 'customer').trim().toLowerCase();
      const isHotelOwner = accountType === 'hotel_owner';
      const hotelName = String(req.body.hotelName || '').trim();
      const hotelCity = String(req.body.hotelCity || '').trim();
      const hotelCountry = String(req.body.hotelCountry || '').trim();
      const hotelAddress = String(req.body.hotelAddress || '').trim();
      const hotelRating = Number(req.body.hotelRating || 4);

      if (!name || !email || !password) {
        res.status(400).render('auth/register', {
          title: 'Create Account — HotelEase',
          flash: { type: 'error', message: 'All fields are required.' },
          formData: {
            name,
            email,
            accountType,
            hotelName,
            hotelCity,
            hotelCountry,
            hotelAddress,
            hotelRating,
          },
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).render('auth/register', {
          title: 'Create Account — HotelEase',
          flash: { type: 'error', message: 'Password must be at least 8 characters.' },
          formData: {
            name,
            email,
            accountType,
            hotelName,
            hotelCity,
            hotelCountry,
            hotelAddress,
            hotelRating,
          },
        });
        return;
      }

      const existing = await this.userModel.findByEmail(email);
      if (existing) {
        res.status(409).render('auth/register', {
          title: 'Create Account — HotelEase',
          flash: { type: 'error', message: 'An account with this email already exists.' },
          formData: {
            name,
            email,
            accountType,
            hotelName,
            hotelCity,
            hotelCountry,
            hotelAddress,
            hotelRating,
          },
        });
        return;
      }

      if (isHotelOwner) {
        if (!hotelName || !hotelCity || !hotelCountry || !hotelAddress) {
          res.status(400).render('auth/register', {
            title: 'Create Account — HotelEase',
            flash: {
              type: 'error',
              message: 'Please provide all hotel details for hotel owner registration.',
            },
            formData: {
              name,
              email,
              accountType,
              hotelName,
              hotelCity,
              hotelCountry,
              hotelAddress,
              hotelRating,
            },
          });
          return;
        }

        if (!Number.isFinite(hotelRating) || hotelRating < 1 || hotelRating > 5) {
          res.status(400).render('auth/register', {
            title: 'Create Account — HotelEase',
            flash: { type: 'error', message: 'Hotel rating must be between 1 and 5.' },
            formData: {
              name,
              email,
              accountType,
              hotelName,
              hotelCity,
              hotelCountry,
              hotelAddress,
              hotelRating,
            },
          });
          return;
        }
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = await this.userModel.createUser({
        name,
        email,
        password: hashedPassword,
        role: isHotelOwner ? 'hotel_owner_pending' : 'customer',
      });

      if (isHotelOwner) {
        await this.userModel.createHotelOwnerRequest({
          userId,
          hotelName,
          city: hotelCity,
          country: hotelCountry,
          address: hotelAddress,
          rating: hotelRating,
        });
      }

      req.session.user = {
        id: userId,
        role: isHotelOwner ? 'hotel_owner_pending' : 'customer',
        name,
      };

      if (isHotelOwner) {
        req.session.flash = {
          type: 'success',
          message:
            'Your hotel owner request has been submitted. An admin must approve it before you can log in.',
        };
        req.session.destroy((err) => {
          if (err) {
            next(err);
            return;
          }
          res.clearCookie('hotelease.sid');
          res.redirect('/login');
        });
        return;
      }

      res.redirect('/dashboard');
    } catch (err) {
      next(err);
    }
  }

  showLogin(req, res) {
    res.render('auth/login', {
      title: 'Log In — HotelEase',
      flash: res.locals.flash || null,
      formData: {},
    });
  }

  async login(req, res, next) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');

      if (!email || !password) {
        res.status(400).render('auth/login', {
          title: 'Log In — HotelEase',
          flash: { type: 'error', message: 'Email and password are required.' },
          formData: { email },
        });
        return;
      }

      const user = await this.userModel.findByEmail(email);

      if (!user) {
        res.status(401).render('auth/login', {
          title: 'Log In — HotelEase',
          flash: { type: 'error', message: 'Invalid email or password.' },
          formData: { email },
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).render('auth/login', {
          title: 'Log In — HotelEase',
          flash: { type: 'error', message: 'Invalid email or password.' },
          formData: { email },
        });
        return;
      }

      const ownerRequest = await this.userModel.getHotelOwnerRequestByEmail(email);
      if (ownerRequest && ownerRequest.status !== 'approved') {
        const statusMessage =
          ownerRequest.status === 'rejected'
            ? 'Your hotel owner request was not approved. Please contact support or submit a new request.'
            : 'Your hotel owner request is pending admin approval.';
        res.status(403).render('auth/login', {
          title: 'Log In — HotelEase',
          flash: { type: 'error', message: statusMessage },
          formData: { email },
        });
        return;
      }

      // Owner-request approval is the source of truth for hotel-owner access.
      // This prevents accidental escalation if users.role was previously set incorrectly.
      const effectiveRole =
        ownerRequest && ownerRequest.status === 'approved' ? 'hotel_owner' : (user.role || 'customer');

      req.session.user = {
        id: user.id,
        role: effectiveRole,
        name: user.name,
      };

      if (req.session.user.role === 'admin') {
        res.redirect('/admin');
        return;
      }

      if (req.session.user.role === 'hotel_owner') {
        res.redirect('/owner/dashboard');
        return;
      }

      res.redirect('/dashboard');
    } catch (err) {
      next(err);
    }
  }

  logout(req, res, next) {
    req.session.destroy((err) => {
      if (err) {
        next(err);
        return;
      }
      res.clearCookie('hotelease.sid');
      res.redirect('/login');
    });
  }
}

module.exports = AuthController;
