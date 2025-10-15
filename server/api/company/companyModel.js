const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  walletBalance: { type: Number, default: 0 }, // total money in company
  history: [
    {
      type: { type: String }, // 'bet' or 'payout'
      betId: String,
      amount: Number,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const Company = mongoose.models.Company || mongoose.model("Company", companySchema);
module.exports = Company;
