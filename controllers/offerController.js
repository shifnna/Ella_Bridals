const { unblock } = require("sharp");
const Brand = require("../models/brandSchema");
const Product = require("../models/productSchema");
const Offer = require("../models/offerSchema");
const Category = require("../models/categorySchema");



const loadOffers = async (req,res)=>{
    try {
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
    } catch (error) {
        res.redirect("/pageerror")
    }
}

const loadAddOffer = async (req, res) => {
    try {
        const offerType = req.query.offerType || 'Category';
        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });
        
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({ category, brand });
        }

        res.render('addOffer', { category, brand, offerType });
    } catch (error) {
        res.redirect("/pageerror");
    }
};



const addOffer = async (req,res)=>{
    try {
        // console.log("body is :",req.body);
       const {offerType,entityId,discountPercentage,validFrom,validTo,status} = req.body;

       const newOffer = new Offer({
        offerType,
        entityId,
        discountPercentage,
        validFrom,
        validTo,
        status,
       })
       
       newOffer.save();

       if(offerType== 'Category'){
        await Category.findOneAndUpdate({name: entityId},{$set:{categoryOffer:discountPercentage}});
       }else if(offerType== 'Brand'){
        await Brand.findOneAndUpdate({brandName: entityId},{$set:{brandOffer:discountPercentage}})
       }

       console.log("Offer created Successfully");
       
       res.redirect("/admin/offers")
    } catch (error) {
        console.log("error adding offer",error);       
        res.redirect("/pageerror")
    }
}



const loadEditOffer = async (req, res) => {
    try {
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
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};



const editOffer = async (req,res)=>{
    try {
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
  
    } catch (error) {
        console.log("error editing offer",error);
        
    }
}



const deleteOffer = async (req, res) => {
    try {
        const id = req.query.id;

        const offer = await Offer.findById(id);

        if (offer) {
            await Offer.deleteOne({ _id: id });

            if (offer.offerType === 'Category') {
                await Category.findOneAndDelete({name:offer.entityId})
            } else if (offer.offerType === 'Brand') {
                await Category.findOneAndDelete({name:offer.entityId})
            }

            console.log("Offer deleted and updated successfully.");
            res.redirect("/admin/offers");
        } else {
            res.status(404).json({ error: "Offer not found" });
        }
    } catch (error) {
        console.log("Error deleting offer", error);
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