const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getIceServers } = require("../controllers/callController");

const router = express.Router();

router.get("/ice-servers", protect, getIceServers);

module.exports = router;
