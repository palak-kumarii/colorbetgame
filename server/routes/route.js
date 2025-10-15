const express = require("express")
const router = express.Router()
const { createUser, getAllUsers, getUserById, updateUser, deleteUser, loginUser, verifyOtp } = require("../api/user/userController")
const { createBet, placeBet, withdraw } = require("../api/bet/betController");
const { getWalletBalance, addBalance, getWalletHistory, withdrawBalance } = require("../api/wallet/walletController");



router.post("/user/create", createUser);
router.post("/user/all", getAllUsers);
router.post("/user/get", getUserById);
router.post("/user/update", updateUser);
router.post("/user/delete", deleteUser);
router.post("/user/login", loginUser);
router.post("/user/verifyotp", verifyOtp);
router.post("/bet/create", createBet);
router.post("/bet/place", placeBet);
router.post("/bet/withdraw", withdraw);
router.get("/wallet/balance", getWalletBalance);
router.post("/wallet/add", addBalance);
router.get("/wallet/history", getWalletHistory);
router.post("/wallet/withdraw", withdrawBalance);

module.exports = router;