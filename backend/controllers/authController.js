const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// Register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser =
            await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                bio: user.bio
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user =
            await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message:
                    "Invalid email or password"
            });
        }

        const isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message:
                    "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                bio: user.bio
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Search users
const searchUsers = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || !search.trim()) {
            return res.status(200).json([]);
        }

        // Escape regex special characters so input like "(" or "[a"
        // searches literally instead of crashing the query.
        const escapedSearch =
            search
                .trim()
                .replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

        const users = await User.find({
            _id: {
                $ne: req.user._id
            },

            $or: [
                {
                    name: {
                        $regex: escapedSearch,
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: escapedSearch,
                        $options: "i"
                    }
                }
            ]
        })
            .select("-password")
            .limit(10);

        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Get current user's profile
const getProfile = async (req, res) => {
    try {
        const user =
            await User.findById(req.user._id)
                .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// Update current user's profile
const updateProfile = async (req, res) => {
    try {
        const {
            name,
            bio,
            profileImage
        } = req.body;

        const user =
            await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (name !== undefined) {
            user.name = name.trim();
        }

        if (bio !== undefined) {
            user.bio = bio.trim();
        }

        if (profileImage !== undefined) {
            user.profileImage =
                profileImage;
        }

        await user.save();

        // Let connected clients refresh this user's name / avatar / bio
        const io = req.app.get("io");

        if (io) {
            io.emit("profileUpdated", {
                userId: user._id,
                name: user.name,
                bio: user.bio,
                profileImage:
                    user.profileImage
            });
        }

        res.status(200).json({
            message:
                "Profile updated successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage:
                    user.profileImage,
                bio: user.bio
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    registerUser,
    loginUser,
    searchUsers,
    getProfile,
    updateProfile
};