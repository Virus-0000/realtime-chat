const express = require("express");

const {
    registerUser,
    loginUser,
    searchUsers,
    getProfile,
    updateProfile
} = require("../controllers/authController");

const protect =
    require("../middleware/authMiddleware");

const router = express.Router();


// Register
router.post(
    "/register",
    registerUser
);


// Login
router.post(
    "/login",
    loginUser
);


// Search users
router.get(
    "/search",
    protect,
    searchUsers
);


// Get current user's profile
router.get(
    "/profile",
    protect,
    getProfile
);


// Update current user's profile
router.put(
    "/profile",
    protect,
    updateProfile
);


module.exports = router;