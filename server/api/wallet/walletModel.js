const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0 },
    transactions: [{
        type: { type: String, enum: ['deposit', 'withdraw', 'bet', 'win'], required: true },
        amount: { type: Number, required: true },
        referenceId: { type: String }, // betId or transaction ID
        timestamp: { type: Date, default: Date.now },
    }]
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);