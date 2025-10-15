const User = require("../user/userModel");


const getWalletBalance = async(req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "userId required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({
            status: 200,
            success: true,
            walletBalance: user.walletBalance,
        });
    } catch (err) {
        console.error("Get Wallet Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};


const addBalance = async(req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId) return res.status(400).json({ success: false, message: "userId required" });
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.walletBalance += Number(amount);
        user.betsHistory.push({
            betId: "deposit_" + Date.now(),
            walletBalance: "deposit",
            amount: Number(amount),
            wonAmount: 0,
            timestamp: new Date(),
        });

        await user.save();

        res.json({
            status: 200,
            success: true,
            message: "Funds added successfully",
            walletBalance: user.walletBalance,
        });
    } catch (err) {
        console.error("Add Funds Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};


const getWalletHistory = async(req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "userId required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({
            status: 200,
            success: true,
            transactions: user.betsHistory.sort((a, b) => b.timestamp - a.timestamp),
        });
    } catch (err) {
        console.error("Get Wallet History Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};


const withdrawBalance = async(req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId) return res.status(400).json({ success: false, message: "userId required" });
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.walletBalance < Number(amount)) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }

        user.walletBalance -= Number(amount);
        user.betsHistory.push({
            betId: "withdraw_" + Date.now(),
            walletBalance: "withdraw",
            amount: -Number(amount),
            wonAmount: 0,
            timestamp: new Date(),
        });

        await user.save();

        res.json({
            status: 200,
            success: true,
            message: "Withdrawal processed successfully",
            walletBalance: user.walletBalance,
        });
    } catch (err) {
        console.error("Withdraw Funds Error:", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

module.exports = { getWalletBalance, addBalance, getWalletHistory, withdrawBalance };