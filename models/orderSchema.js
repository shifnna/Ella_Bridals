const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  razorpayOrderId: {
    type:String,
  },
  payment: {
    type: String,
    default: 'COD',
  },
  address: [{
    username: String,
    mobile: Number,
    city: String,
    pincode: Number,
    state: String,
    address: String,
  }],
  status: {
    type: String,
    enum: ['Pending', 'Returned', 'Delivered', 'Cancelled','cancellation','Shipped', 'failed','OrderConfirmed'],
    default: 'Pending',
  },
 

  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Returned', 'Cancelled', 'OrderConfirmed'], default: 'Pending' },
  productImage: [String],
  description: String,
  brand: String,
  color: String,
  size: String,
  category: String,
  }],
  totalAmount: {
    type: Number,
    default: 0,
  },
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false,
    },
    reason: {
      type: String,
      default: '',
    },
    cancelledByAdmin: {
      type: Boolean,
      default: false,
    },
  },
 
  discountAmount: {
    type: Number,
    default: 0,
  },
  orderDate:{
    type: Date,
    default:Date.now
  },
  deliveredAt: {
    type: Date,
    // default: Date.now
  },
  couponDiscount:{
    type: Number,

  },
  offerDiscount:{
    type: Number,
  },
  orderNumber: { 
    type: String, 
    // unique: true 
  },

});

module.exports = mongoose.model('Order', orderSchema);