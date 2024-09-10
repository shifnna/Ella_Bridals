// const mongoose = require('mongoose');

// const productSchema = new mongoose.Schema({
//   productName: { type: String, required: true },
//   description: { type: String, required: true },
//   regularPrice: { type: Number, required: true },
//   salePrice: { type: Number },
//   quantity: { type: Number, required: true },
//   category: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'Category', 
//     required: true 
// },
//   brand: { 
//     type: mongoose.Schema.Types.ObjectId,
//      ref: 'Brand' 
//     },
//   productImage: [{ 
//     type: String, 
//     // required: true 
// }],
//   ratings: { type: Number, default: 0 },
//   reviews: [{ 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'Review' 
// }],
//   offerPercentage: { 
//     type: Number, 
//     default:0 
// },
// images:[String],

// offerPrice: { 
//     type: Number, 
//     default:0 
// },
// productOffer:{
//     type: Number, 
//     default:0
// },
//   discountPrice: { type: Number },
//   isSoldOut: { type: Boolean, default: false },
//   createdOn: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Product', productSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

module.exports = mongoose.model('Product', productSchema);
