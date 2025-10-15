const Bet = require("./betModel");
const User = require("../user/userModel");
const Company = require("../company/companyModel");

// Generate random hex color
function randomHex() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}


const createBet = async(req, res) => {
    try {
        const colors = [];
        while (colors.length < 3) {
            const newColor = randomHex();
            if (!colors.includes(newColor)) colors.push(newColor);
        }

        const formattedColors = colors.map((hex) => ({
            hex,
            totalAmount: 0,
        }));

        const betId = `bet_${Date.now()}`;

        const bet = await Bet.create({
            betId,
            colors: formattedColors,
            totalPool: 0,
            status: "open",
            entries: [],
            createdAt: new Date(),
        });

        res.status(201).json({
            success: true,
            message: "Bet created successfully",
            bet,
        });
    } catch (err) {
        console.error("Create Bet Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Handle payout to winners
const handlePayout = async(bet) => {
    let company = await Company.findOne();
    if (!company) {
        company = await Company.create({ walletBalance: 0, history: [] });
    }

    // Winner = color with least total bet amount
    const minAmount = Math.min(...bet.colors.map((c) => c.totalAmount));
    const minColorObj = bet.colors.find((c) => c.totalAmount === minAmount);
    const winnerColor = minColorObj.hex;

    const winners = bet.entries.filter(
        (e) => e.color.toLowerCase() === winnerColor.toLowerCase()
    );

    // Commission Logic (10% → winners, 90% → company)
    const totalPool = bet.totalPool;
    const winnersPool = Math.round(totalPool * 0.1 * 100) / 100; // 10%
    const companyCommission = totalPool - winnersPool; // 90%

    // Distribute payout to winners (proportionally)
    const winnersTotalAmount = winners.reduce((sum, e) => sum + e.amount, 0);
    for (const e of winners) {
        const share =
            winnersTotalAmount > 0 ?
            Math.round((e.amount / winnersTotalAmount) * winnersPool * 100) / 100 :
            0;

        const user = await User.findById(e.user);
        if (user) {
            user.walletBalance += share;
            user.betsHistory.push({
                betId: bet.betId,
                color: winnerColor,
                amount: e.amount,
                wonAmount: share,
                timestamp: new Date(),
            });
            await user.save();
            e.wonAmount = share;
        }
    }

    // Add 90% commission to company wallet
    company.walletBalance += companyCommission;
    company.history.push({
        type: "commission",
        betId: bet.betId,
        amount: companyCommission,
    });
    await company.save();

    // Update bet status
    bet.status = "closed";
    bet.winnerColor = winnerColor;
    await bet.save();

    return { winnerColor, winners, companyCommission };
};

// Place a bet (only one per user per round)
const placeBet = async(req, res) => {
    try {
        const { userId, betId, color, amount } = req.body;

        if (!userId || !betId || !color || !amount || amount <= 0) {
            return res
                .status(400)
                .json({ message: "userId, betId, color, and amount required" });
        }

        // ✅ FIX: user variable must be defined before using
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.walletBalance < Number(amount)) {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance. Please add funds.",
            });
        }

        const bet = await Bet.findOne({ betId });
        if (!bet || bet.status !== "open") {
            return res.status(400).json({
                message: "Bet not found or already closed",
            });
        }

        // Check if user already placed bet in this round
        const alreadyBet = bet.entries.some(
            (entry) => entry.user.toString() === userId
        );
        if (alreadyBet) {
            return res.status(400).json({
                success: false,
                message: "You have already placed a bet in this round!",
            });
        }

        const colorObj = bet.colors.find(
            (c) => c.hex.toLowerCase() === color.toLowerCase()
        );
        if (!colorObj)
            return res.status(400).json({ message: "Invalid color" });

        // Deduct from user wallet
        user.walletBalance -= Number(amount);
        user.betsHistory.push({
            betId,
            color: colorObj.hex,
            amount: -Number(amount),
            wonAmount: 0,
            timestamp: new Date(),
        });
        await user.save();

        // Add user entry to bet
        bet.entries.push({
            user: userId,
            color: colorObj.hex,
            amount: Number(amount),
            wonAmount: 0,
        });

        colorObj.totalAmount += Number(amount);
        bet.totalPool += Number(amount);
        await bet.save();

        // Delay payout by 2 minutes (120000 ms)
        setTimeout(async() => {
            const freshBet = await Bet.findOne({ betId });
            if (freshBet && freshBet.status === "open") {
                const { winnerColor, companyCommission } = await handlePayout(freshBet);
                console.log(
                    `✅ Payout done for bet ${freshBet.betId}. Winner: ${winnerColor}. Company earned: ${companyCommission}`
                );
            }
        }, 120000);

        res.json({
            status: 200,
            success: true,
            message: "Bet placed successfully. Winner will be decided in 2 minutes.",
            bet,
        });
    } catch (err) {
        console.error("Place Bet Error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message,
        });
    }
};
// Withdraw funds using userId
const withdraw = async(req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || !amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "userId and valid amount are required"
            });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.walletBalance < Number(amount)) {
            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance"
            });
        }

        // Deduct amount and add to user history
        user.walletBalance -= Number(amount);
        user.betsHistory.push({
            betId: "withdraw_" + Date.now(),
            color: "withdraw",
            amount: -Number(amount),
            wonAmount: 0,
            timestamp: new Date(),
        });

        await user.save();

        res.json({
            status: 200,
            success: true,
            message: "Withdrawal processed successfully",
            newBalance: user.walletBalance,
        });
    } catch (err) {
        console.error("Withdraw Error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message,
        });
    }
};


module.exports = { createBet, placeBet, withdraw, handlePayout };