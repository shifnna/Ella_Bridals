const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
    enum: ['Pending', 'Returned', 'Delivered', 'Cancelled','cancellation','Shipped'],
    default: 'Pending',
  },
 

  products: [],
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
});

module.exports = mongoose.model('Order', orderSchema);