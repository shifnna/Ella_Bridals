const mongoose=require("mongoose");
const {Schema} = mongoose;


// const transactionSchema = new mongoose.Schema({
//     date: { type: Date, default: Date.now },
//     description: { type: String, required: true },
//     amount: { type: Number, required: true } // Positive for credits, negative for debits
// });


const userSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:false, //for eg: oru single sign up cheyyanengil like google/facebook there phn number is not necessary.
        unique:false,
        sparse:true,
        default:null
    },
    googleId:{
        type:String,
        unique:true,
        sparse:true,//sparse allows multiple nulls
    },
    password:{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    isAdmin:{
        type:Boolean,
        default:false,
    },
    cart:[{
       type:Schema.Types.ObjectId, //it is a reference to another collection
       ref:"Cart", //collection name
    }],
    wallet:{
        type:Number,
        default:0,
    },
    // transactions: [transactionSchema] ,

    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: "Product",
    }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default:Date.now,

    },
    referalCode:{
        type:String, //id
        // required:true,
    },
    redeemed:{
        type:Boolean,
        // required:true,  
    },
    reedeemedUsers:[{
        type:Schema.Types.ObjectId,
        ref:"User",//edhokke users redeemed cheythu enn ariyan
        // required:true,
    }],
    searchHistory:[{   //filter or sort chythathin shesham athil ninn product pick cheyyan
        category:{
            type:Schema.Types.ObjectId,
            ref:"Category"
        },
        brand:{
            type:String,
        },
        searchOn:{
            type:Date,
            default:Date.now,
        }
    }],
    addresses: [{
        type: Schema.Types.ObjectId,
        ref: 'Address'
    }]
    
})


module.exports = mongoose.model("User",userSchema)