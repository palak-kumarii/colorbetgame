const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: false },
    phone: { type: String, required: true, unique: true },
    otp: { type: String, default: null },
    walletBalance: { type: Number, default: 0 },
    reservedBalance: { type: Number, default: 0 },
    betsHistory: [{
        betId: { type: String },
        color: { type: String },
        amount: { type: Number },
        wonAmount: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now },

    }],
    isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);