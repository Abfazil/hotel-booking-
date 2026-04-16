const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');

module.exports = function favouriteRoutes(favouriteController) {
  const router = express.Router();

  router.get('/favourites', requireAuth, favouriteController.list);
  router.post('/favourites/:hotelId/toggle', (req, res, next) => {
    if (req.session?.user) return next();
    res.status(401).json({ redirect: '/login' });
  }, favouriteController.toggle);

  return router;
};

