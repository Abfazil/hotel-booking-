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
      formData: {},
    });
  }

  async register(req, res, next) {
    try {
      const name = String(req.body.name || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');

      if (!name || !email || !password) {
        res.status(400).render('auth/register', {
          title: 'Create Account — HotelEase',
          flash: { type: 'error', message: 'All fields are required.' },
          formData: { name, email },
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).render('auth/register', {
          title: 'Create Account — HotelEase',
          flash: { type: 'error', message: 'Password must be at least 8 characters.' },
          formData: { name, email },
        });
        return;
      }

      const existing = await this.userModel.findByEmail(email);
      if (existing) {
        res.status(409).render('auth/register', {
          title: 'Create Account — HotelEase',
          flash: { type: 'error', message: 'An account with this email already exists.' },
          formData: { name, email },
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const userId = await this.userModel.createUser({
        name,
        email,
        password: hashedPassword,
        role: 'customer',
      });

      req.session.user = {
        id: userId,
        role: 'customer',
        name,
      };

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

      req.session.user = {
        id: user.id,
        role: user.role || 'customer',
        name: user.name,
      };

      if (req.session.user.role === 'admin') {
        res.redirect('/admin');
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
