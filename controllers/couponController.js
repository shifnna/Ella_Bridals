const { unblock } = require("sharp");
const Brand = require("../models/brandSchema");
const Product = require("../models/productSchema");
const Offer = require("../models/offerSchema");
const Coupon = require("../models/couponSchema");



const loadCoupons = async (req,res)=>{
    try {
        
if(req.session.admin){
    let search = "";
        if(req.query.search){
            search=req.query.search;
        }
        
        let page = 1
        if(req.query.page){
            page=req.query.page;
        }
        const limit = 10;

        const couponData = await Coupon.find({
            $or:[
                {couponCode:{ $regex: ".*" + search + ".*", $options: "i" }},
                {description:{ $regex: ".*" + search + ".*", $options: "i" }}
            ],

        }).sort({createdAt:-1}).limit(limit*1).skip((page-1)*limit).exec()//chain of promise ne combine cheyyan

    const count = await Coupon.find({
        $or:[
            {couponCode:{ $regex: ".*" + search + ".*", $options: "i" }},
            {description:{ $regex: ".*" + search + ".*", $options: "i" }}
        ],
    }).countDocuments();
    
    const totalPages = Math.ceil(count / limit);

    res.render("couponManagement", { data: couponData, totalPages: totalPages, currentpage: page, search: search });
}else{
    return res.redirect("/pageerror")
}
    
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const loadAddCoupon = async (req,res)=>{
    try {
        if(req.session.admin){
 // const page = parseInt(req.query.page) || 1;
        // const limit = 5;
        // const skip = (page-1)*limit;
        // const brandData = await Brand.find({}).sort({createdAt:-1}).skip(skip).limit(limit);
        // const totalBrands = await Brand.countDocuments();
        // const totalPages = Math.ceil(totalBrands/limit);
        // const reverseBrand = brandData.reverse();
        res.render("addcoupon")
        // res.render("offer")        
        }else{
            return res.redirect("/pageerror")
        }
       
    } catch (error) {
        res.redirect("/pageerror")
    }
}


const addCoupon = async (req, res) => {
    try {
        
if(req.session.admin){
   // console.log("body is :",req.body);
        
   const { couponCode, discountType, discountValue, expiryDate, minOrderAmount, maxOrderAmount, description } = req.body;
   console.log(req.body);
   
   console.log('expiry',expiryDate);
   
if (!couponCode || !discountType || !discountValue || !expiryDate || !minOrderAmount) {
       throw new Error("All required fields must be filled."); //render cheyth error kanikkanam
   }
   const newCoupon = new Coupon({
       couponCode :couponCode,
       discountType :discountType,
       discountValue :discountValue,
       expiryDate :expiryDate,
       minOrderAmount:minOrderAmount,
       maxOrderAmount :maxOrderAmount,
       description :description,
   });

   console.log(newCoupon);
   

   await newCoupon.save();
   console.log("coupon created successfully");       
   res.redirect("/admin/coupon")
}else{
    return res.redirect("/pageerror")
}
     
    } catch (error) {
        res.status(400).json({ message: 'Error creating coupon', error: error.message });
    }
};


const deleteCoupon = async (req,res)=>{
    try {
        
if(req.session.admin){
    const id = req.query.couponId;
    console.log(id);
    
    if(id){
     await Coupon.deleteOne({_id:id});
     res.redirect("/admin/coupon")
    }else{
        res.redirect("/pageerror");
    }
}else{
    return res.redirect("/pageerror")
}
       
    } catch (error) {
        res.status(400).json({ message: 'Error deleting coupon', error: error.message });
    }
}




const loadEditCoupon = async (req,res)=>{
    try {
        
if(req.session.admin){

    let id = req.query.id;
    const coupon = await Coupon.findOne({_id:id});
     res.render("editCoupon",{coupon:coupon});
    }else{
    return res.redirect("/pageerror")
}
    } catch (error) {
        res.redirect("/pageerror");
    }
}



const editCoupon = async (req,res)=>{
    try {
        
if(req.session.admin){
    const id=req.query.id;
        const { couponCode, discountType, discountValue, expiryDate, minOrderAmount, maxOrderAmount, description } = req.body;
     
        const updateCoupon = await Coupon.findByIdAndUpdate(id,{
            couponCode :couponCode,
            discountType :discountType,
            discountValue :discountValue,
            expiryDate :expiryDate,
            minOrderAmount:minOrderAmount,
            maxOrderAmount :maxOrderAmount,
            description :description,
            
        },{new:true});

        if(updateCoupon){
            res.redirect("/admin/coupon")
        }else{
            res.status(404).json({error:"Coupon not found"})
        }
}else{
    return res.redirect("/pageerror")
}
    
    } catch (error) {
        res.status(500).json({error:"internal Server Error"})
    }
}
module.exports = {
    loadCoupons,
    loadAddCoupon,
    addCoupon,
    deleteCoupon,
    editCoupon,
    loadEditCoupon,
}