const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    offerType: {
        type: String, // Can be 'product', 'brand', 'occasion', etc.
        required: true
    },
    entityId: {
         type:String,  // mongoose.Schema.Types.ObjectId, // This refers to the product, brand, or occasion ID
        required: true,
        enum: ['Brand', 'Category'],
        // refPath: 'onModel' // Dynamic reference based on the offer type
    },
    // onModel: {
    //     type: String,
    //     required: true,
    //     enum: ['Product', 'Brand', 'Category'] // Reference models
    // },
    discountPercentage: {
        type: Number,
        required: true
    },
    validFrom: {
        type: Date,
        required: true
    },
    validTo: {
        type: Date,
        required: true
    },
    status: {
        type: Boolean, // True if offer is active
        default: true
    }
});

module.exports = mongoose.model('Offer', offerSchema);