const mongoose = require("mongoose");

const betHistorySchema = new mongoose.Schema({
    betId: { type: String },
    type: { type: String }, // deposit / withdraw / bet / win
    amount: { type: Number },
    wonAmount: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
    name: { type: String },
    phone: { type: String, required: true, unique: true },
    walletBalance: { type: Number, default: 0 }, // in-app wallet
    accountNumber: { type: String, unique: true, sparse: true }, // virtual bank account
    accountBalance: { type: Number, default: 0 }, // withdrawn/real account balance
    isAdmin: { type: Boolean, default: false },
    otp: { type: String, default: null },
    betsHistory: [betHistorySchema],
});

module.exports = mongoose.model("User", userSchema);