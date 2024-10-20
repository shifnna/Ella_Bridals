const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: false,
        unique: false,
        sparse: true,
        default: null
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        required: false
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    cart: [{
        type: Schema.Types.ObjectId,
        ref: "Cart",
    }],
    wallet: {
        type: Number,
        default: 0,
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: "Product",
    }],
    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],
    createdOn: {
        type: Date,
        default: Date.now,
    },
    referalCode: {
        type: String,
        // Uncomment if needed
        // required: true,
    },
    redeemed: {
        type: Boolean,
    },
    reedeemedUsers: [{
        type: Schema.Types.ObjectId,
        ref: "User",
    }],
    searchHistory: [{
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category"
        },
        brand: {
            type: String,
        },
        searchOn: {
            type: Date,
            default: Date.now,
        }
    }],
    addresses: [{
        type: Schema.Types.ObjectId,
        ref: 'Address'
    }],
    referenceCode: { 
        type: String, 
        unique: true, 
        sparse: true // Allows multiple nulls
    },
    passwordResetToken: {
        type: String,
        required: false,
    },
    passwordResetExpires: {
        type: Date,
        required: false,
    },
});

module.exports = mongoose.model("User", userSchema);
