const jwt = require("jsonwebtoken");
const User = require("../models/User");

const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(
                new Error("Authentication token missing")
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(
            decoded.userId
        ).select("-password");

        if (!user) {
            return next(
                new Error("User not found")
            );
        }

        socket.user = user;

        next();
    } catch (error) {
        next(
            new Error("Invalid authentication token")
        );
    }
};

module.exports = socketAuth;