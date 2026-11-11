const express = require("express");

const localRoutes = require("./local/local.routes");
const socialRoutes = require("./social/social.routes");

const router = express.Router();

router.use(socialRoutes);
router.use(localRoutes);

module.exports = router;
