
const express = require('express');

module.exports = function hotelRoutes(hotelController) {
  const router = express.Router();

  router.get('/', hotelController.home);
  router.get('/hotels', hotelController.list);
  router.get('/hotels/:id', hotelController.detail);

  return router;
};

