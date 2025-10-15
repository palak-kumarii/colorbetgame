const mongoose = require("mongoose")
require("dotenv").config()

const connectDB = async(req, res) => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("mongodb is connect successfully")

    } catch (err) {
        console.log("mongodb is not connected due to error", err)
        process.exit(1)
    }
}

module.exports = connectDB