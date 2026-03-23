
class AuthController {
  constructor() {
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
  }

  login(req, res) {
    res.render('login', { title: 'Log In — HotelEase' });
  }

  register(req, res) {
    res.render('register', { title: 'Create Account — HotelEase' });
  }
}

module.exports = AuthController;

