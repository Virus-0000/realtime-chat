const mongoose = require("mongoose");
const User = require("../models/User");

const connectDB = async () => {
    try {
        await mongoose.connect(
            process.env.MONGO_URI ||
            "mongodb://127.0.0.1:27017/realtime-chat"
        );

        console.log("MongoDB connected");

        // No sockets exist yet, so nobody can really be online.
        await User.updateMany(
            { isOnline: true },
            { $set: { isOnline: false } }
        );
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;