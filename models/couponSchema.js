const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'amount'],
  },
  discountValue: {
    type: Number,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  minOrderAmount: {
    type: Number,
    required: true,
  },
  maxOrderAmount: {
    type: Number,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

couponSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


// // Pre-save hook to update the `updatedAt` field before saving
// couponSchema.pre('save', function (next) {
//   this.updatedAt = Date.now();
//   next();
// });
module.exports =  mongoose.model('Coupon', couponSchema);
