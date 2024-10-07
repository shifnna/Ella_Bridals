const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    default: Date.now 
   },
  description: { type: String, required: true },
  amount: { type: Number, required: true }, // Positive for credits, negative for debits
  userId: { type:String , required:true},
  orderId: { type: String,},
});

module.exports = mongoose.model('Transaction', transactionSchema);