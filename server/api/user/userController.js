const User = require("./userModel");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Helper to generate unique account number
const generateAccountNumber = async() => {
    let accountNumber;
    let exists = true;

    while (exists) {
        accountNumber = "ACCT" + Math.floor(100000 + Math.random() * 900000);
        const user = await User.findOne({ accountNumber });
        if (!user) exists = false;
    }

    return accountNumber;
};

// ✅ Create a new user
const createUser = async(req, res) => {
    try {
        const { name, phone, walletBalance = 0, isAdmin = false, accountNumber } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.json({
                status: 400,
                success: false,
                message: "User with this phone already exists",
            });
        }

        // Use provided accountNumber or generate a new one
        let finalAccountNumber = accountNumber;
        if (!finalAccountNumber) {
            finalAccountNumber = await generateAccountNumber();
        } else {
            // Check if provided account number is unique
            const exists = await User.findOne({ accountNumber: finalAccountNumber });
            if (exists) {
                return res.json({
                    status: 400,
                    success: false,
                    message: "Provided account number already exists",
                });
            }
        }

        const user = new User({
            name,
            phone,
            walletBalance,
            accountNumber: finalAccountNumber,
            accountBalance: 0,
            isAdmin,
        });

        await user.save();

        res.json({
            status: 201,
            success: true,
            message: "User created successfully",
            user,
        });
    } catch (error) {
        res.json({
            status: 500,
            success: false,
            message: "Error creating user",
            error: error.message,
        });
    }
};

// ✅ Get all users
const getAllUsers = async(req, res) => {
    try {
        const users = await User.find();
        res.json({
            status: 200,
            success: true,
            message: "All users fetched successfully",
            users,
        });
    } catch (error) {
        res.json({
            status: 500,
            success: false,
            message: "Failed to fetch users",
            error: error.message,
        });
    }
};

// ✅ Get user by ID
const getUserById = async(req, res) => {
    try {
        const { id } = req.body;
        const user = await User.findById(id);

        if (!user)
            return res.json({ status: 404, success: false, message: "User not found" });

        res.json({
            status: 200,
            success: true,
            message: "User fetched successfully",
            user,
        });
    } catch (error) {
        res.json({
            status: 500,
            success: false,
            message: "Error fetching user",
            error: error.message,
        });
    }
};

// ✅ Update user
const updateUser = async(req, res) => {
    try {
        const { id, name, walletBalance, accountBalance, isAdmin } = req.body;

        const user = await User.findByIdAndUpdate(
            id, { name, walletBalance, accountBalance, isAdmin }, { new: true, runValidators: true }
        );

        if (!user)
            return res.json({ status: 404, success: false, message: "User not found" });

        res.json({
            status: 200,
            success: true,
            message: "User updated successfully",
            user,
        });
    } catch (error) {
        res.json({
            status: 500,
            success: false,
            message: "Error updating user",
            error: error.message,
        });
    }
};

// ✅ Delete user
const deleteUser = async(req, res) => {
    try {
        const { id } = req.body;
        const user = await User.findByIdAndDelete(id);

        if (!user)
            return res.json({ status: 404, success: false, message: "User not found" });

        res.json({
            status: 200,
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        res.json({
            status: 500,
            success: false,
            message: "Error deleting user",
            error: error.message,
        });
    }
};

// ✅ Step 1: Login user (Generate OTP)
const loginUser = async(req, res) => {
    try {
        const { phone } = req.body;
        if (!phone)
            return res.status(400).json({ success: false, message: "Phone is required" });

        let user = await User.findOne({ phone });
        if (!user)
            return res.status(404).json({ success: false, message: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        await user.save();

        res.status(200).json({ success: true, message: "OTP sent to phone", otp });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error during login",
            error: error.message,
        });
    }
};

// ✅ Step 2: Verify OTP and issue JWT
const verifyOtp = async(req, res) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp)
            return res
                .status(400)
                .json({ success: false, message: "Phone and OTP required" });

        const user = await User.findOne({ phone });
        if (!user || user.otp !== otp)
            return res.status(400).json({ success: false, message: "Invalid OTP" });

        user.otp = null;
        await user.save();

        const token = jwt.sign({ userId: user._id, phone: user.phone, isAdmin: user.isAdmin },
            JWT_SECRET, { expiresIn: "7d" }
        );

        res.status(200).json({
            success: true,
            message: "User authenticated",
            token,
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error verifying OTP",
            error: error.message,
        });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    loginUser,
    verifyOtp,
};