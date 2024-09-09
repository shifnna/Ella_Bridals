const mongoose = require('mongoose');

const productSchema = new Schema({
  productName: { 
      type: String, 
      required: true 
  },
  description: { 
      type: String, 
      required: true 
  }, // Ensure this matches your code
  brand: { 
      type: String, 
      required: true 
  },
  category: { 
      type: Schema.Types.ObjectId, 
      ref: 'Category', 
      required: true 
  },
  regularPrice: { 
      type: Number,
      required: true 
  },
  salePrice: { 
      type: Number 
  },
  createdOn: { 
      type: Date, 
      default: Date.now 
  },
  quantity: { 
      type: Number, 
      required: true 
  },
  color: { 
      type: String 
  },
  size: { 
      type: String 
  },
  productImage: [{ 
      type: String 
  }],
  status: { 
      type: String, 
      default: 'Available' 
  },
  offerPercentage: { 
      type: Number, 
      default:0 
  },
  offerPrice: { 
      type: Number, 
      default:0 
  },
  productOffer:{
      type: Number, 
      default:0
  },
  isBlocked:{
      type:Boolean,
      default:false,
  },
},{timestamps:true});


module.exports = mongoose.model('Order', orderSchema);
