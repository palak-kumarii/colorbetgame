const mongoose  = require("mongoose")

const entrySchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:"User"},
    color:String,
    amount:Number,
    wonAmount:{type:Number,default:0}
})

const colorSchema = new mongoose.Schema({
    hex:String,
    totalAmount:{type:Number,default:0}
})

const betSchema = new mongoose.Schema({
    betId:String,
    colors:[colorSchema],
    entries:[entrySchema],
    totalPool:{type:Number,default:0},
    status:{type:String,default:"open"},
    winnerColor:String,
    createdAt:{type:Date,default:Date.now}
})

const Bet = mongoose.models.Bet || mongoose.model("Bet",betSchema)
module.exports = Bet
