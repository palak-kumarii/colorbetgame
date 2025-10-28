const User = require("../user/userModel");
const mongoose = require("mongoose");


const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["deposit", "withdraw"], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const Transaction = mongoose.models.WalletTransaction || mongoose.model("Transaction", transactionSchema);


const getWalletBalance = async(req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "userId required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({
            success: true,
            walletBalance: user.walletBalance,
            accountBalance: user.accountBalance,
            accountNumber: user.accountNumber,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

const addBalance = async(req, res) => {
    try {
        const { userId, amount } = req.body;
        if (!userId || !amount || Number(amount) <= 0)
            return res.status(400).json({ success: false, message: "Invalid userId or amount" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const depositAmount = Number(amount);
        user.walletBalance += depositAmount;


        user.betsHistory.push({
            betId: "deposit_" + Date.now(),
            type: "deposit",
            amount: depositAmount,
            wonAmount: 0,
            timestamp: new Date(),
        });

        await user.save();

        const transaction = new Transaction({ userId, type: "deposit", amount: depositAmount });
        await transaction.save();

        res.json({
            success: true,
            message: "Deposit successful",
            walletBalance: user.walletBalance,
            transaction,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


const withdrawBalance = async(req, res) => {
    try {
        const { userId, amount } = req.body;
        if (!userId || !amount || Number(amount) <= 0)
            return res.status(400).json({ success: false, message: "Invalid userId or amount" });

        const withdrawAmount = Number(amount);

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.walletBalance < withdrawAmount)
            return res.status(400).json({ success: false, message: "Insufficient wallet balance" });

        if (!user.accountNumber)
            return res.status(400).json({ success: false, message: "User has no accountNumber" });


        user.walletBalance -= withdrawAmount;
        user.accountBalance = (user.accountBalance || 0) + withdrawAmount;


        const withdrawTxId = "withdraw_" + Date.now();
        const creditTxId = "account_credit_" + Date.now();

        user.betsHistory.push({
            betId: withdrawTxId,
            type: "withdraw",
            amount: -withdrawAmount,
            wonAmount: 0,
            timestamp: new Date(),
        });

        user.betsHistory.push({
            betId: creditTxId,
            type: "account_credit",
            amount: withdrawAmount,
            wonAmount: 0,
            timestamp: new Date(),
        });

        await user.save();


        const transaction = new Transaction({ userId, type: "withdraw", amount: withdrawAmount });
        await transaction.save();

        res.json({
            success: true,
            message: "Withdrawal successful",
            walletBalance: user.walletBalance,
            accountBalance: user.accountBalance,
            accountNumber: user.accountNumber,
            transaction,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


const getWalletHistory = async(req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "userId required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const transactions = await Transaction.find({ userId }).sort({ date: -1 });

        res.json({
            success: true,
            message: "Wallet transaction history fetched",
            betsHistory: user.betsHistory.sort((a, b) => b.timestamp - a.timestamp),
            transactions,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

module.exports = {
    getWalletBalance,
    addBalance,
    withdrawBalance,
    getWalletHistory,
};