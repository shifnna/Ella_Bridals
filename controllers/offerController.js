const { unblock } = require("sharp");
const Brand = require("../models/brandSchema");
const Product = require("../models/productSchema");
const Offer = require("../models/offerSchema");
const Category = require("../models/categorySchema");


const loadOffers = async (req,res)=>{
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

    const offerData = await Offer.find({
        $or:[
            { offerType: { $regex: ".*" + search + ".*", $options: "i" } },
            { entityId: { $regex: ".*" + search + ".*", $options: "i" } },
        ],

    }).sort({offerType:1}).limit(limit*1).skip((page-1)*limit).exec()//chain of promise ne combine cheyyan

const count = await Offer.find({
    $or:[
        { offerType: { $regex: ".*" + search + ".*", $options: "i" } },
        { entityId: { $regex: ".*" + search + ".*", $options: "i" } },
    ],
}).countDocuments();

const totalPages = Math.ceil(count / limit);

res.render("offer", { data: offerData, totalPages: totalPages, currentpage: page, search: search });    
}else{
    res.redirect("/pageerror")
}
       
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const loadAddOffer = async (req, res) => {
    try {
        
if(req.session.admin){
    const offerType = req.query.offerType || 'Category';
    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ category, brand });
    }

    res.render('addOffer', { category, brand, offerType });    
}else{
    res.redirect("/pageerror")
}
    } catch (error) {
        res.redirect("/pageerror");
    }
};





const addOffer = async (req, res) => {
    try {
        if (req.session.admin) {
            const {
                offerType,
                entityId,
                discountPercentage,
                validFrom,
                validTo,
                status,
            } = req.body;

            const newOffer = new Offer({
                offerType,
                entityId,
                discountPercentage,
                validFrom,
                validTo,
                status,
            });

            await newOffer.save(); // Save the new offer

            // Update products based on the offer type
            let products;
            if (offerType === 'Category') {
                // Fetch the products associated with the category
                const category = await Category.findOne({ name: entityId });
                if (category) {
                    products = await Product.find({ category: category._id });
                }
            } else if (offerType === 'Brand') {
                // Fetch the products associated with the brand
                const brand = await Brand.findOne({ brandName: entityId });
                if (brand) {
                    products = await Product.find({ brand: brand._id });
                }
            }

            // Update each product with the new offer details
            if (products && products.length > 0) {
                for (const product of products) {
                    // Update offer percentage
                    product.offerPercentage = discountPercentage;

                    // Calculate the new offer price based on the sale price
                    product.offerPrice = product.salePrice - Math.floor(product.salePrice * (discountPercentage / 100));

                    // Save the updated product
                    await product.save();
                }
            }

            console.log("Offer created and products updated successfully.");
            res.redirect("/admin/offers");
        } else {
            res.redirect("/pageerror");
        }
    } catch (error) {
        console.log("Error adding offer:", error);
        res.redirect("/pageerror");
    }
};




const loadEditOffer = async (req, res) => {
    try {
        
if(req.session.admin){
    let id = req.query.id;
    const offer = await Offer.findOne({ _id: id });
    const offerType = offer.offerType || 'Category'; // Use offer's saved type or default to 'Category'
    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });

    // Check if it's an AJAX request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ category, brand });
    }

    // Render the edit offer page with the saved offer and available categories/brands
    res.render("editOffer", { offer, offerType, category, brand });    
}else{
    res.redirect("/pageerror")
}       
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};



const editOffer = async (req,res)=>{
    try {
        
if(req.session.admin){
    const id=req.query.id;
    // console.log("body is :",req.body);
    const {offerType,entityId,discountPercentage,validFrom,validTo,status} = req.body;

    const updateOffer = await Offer.findByIdAndUpdate(id,{
    offerType,
    entityId,
    discountPercentage,
    validFrom,
    validTo,
    status,
        
    },{new:true});

    if(updateOffer){
        
        if(offerType== 'Category'){
            await Category.findOneAndUpdate({name: entityId},{$set:{categoryOffer:discountPercentage}});
           }else if(offerType== 'Brand'){
            await Brand.findOneAndUpdate({brandName: entityId},{$set:{brandOffer:discountPercentage}})
           }

        res.redirect("/admin/offers")
    }else{
        res.status(404).json({error:"Offer not found"})
    }    
}else{
    res.redirect("/pageerror")
}
        
  
    } catch (error) {
        console.log("error editing offer",error);
        
    }
}



const deleteOffer = async (req, res) => {
    try {
        if (req.session.admin) {
            const id = req.query.id;

            const offer = await Offer.findById(id);

            if (offer) {
                // Fetch the products associated with the offer type
                let products;
                if (offer.offerType === 'Category') {
                    const category = await Category.findOne({ name: offer.entityId });
                    if (category) {
                        products = await Product.find({ category: category._id });
                    }
                } else if (offer.offerType === 'Brand') {
                    const brand = await Brand.findOne({ brandName: offer.entityId });
                    if (brand) {
                        products = await Product.find({ brand: brand._id });
                    }
                }

                // Reset offer details for each product
                if (products && products.length > 0) {
                    for (const product of products) {
                        product.offerPercentage = 0;  // Reset the offer percentage
                        product.offerPrice = product.salePrice;  // Reset the offer price back to the sale price

                        await product.save();  // Save the updated product
                    }
                }

                // Delete the offer
                await Offer.deleteOne({ _id: id });

                console.log("Offer deleted and products updated successfully.");
                res.redirect("/admin/offers");
            } else {
                res.status(404).json({ error: "Offer not found" });
            }
        } else {
            res.redirect("/pageerror");
        }
    } catch (error) {
        console.log("Error deleting offer:", error);
        res.redirect("/pageerror");
    }
};




module.exports = {
    loadOffers,
    loadAddOffer,
    addOffer,
    deleteOffer,
    loadEditOffer,
    editOffer
}