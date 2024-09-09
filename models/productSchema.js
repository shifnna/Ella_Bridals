const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true 
},
  brand: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: 'Brand' 
    },
  images: [{ 
    type: String, 
    required: true 
}],
  ratings: { type: Number, default: 0 },
  reviews: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Review' 
}],
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
  discountPrice: { type: Number },
  isSoldOut: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
