const { unblock } = require("sharp");
const Brand = require("../models/brandSchema");
const product = require("../models/productSchema");



const loadBrands = async (req,res)=>{
    try {
        if(req.session.admin){
            const page = parseInt(req.query.page) || 1;
            const limit = 5;
            const skip = (page-1)*limit;
            const brandData = await Brand.find({}).sort({createdAt:-1}).skip(skip).limit(limit);
            const totalBrands = await Brand.countDocuments();
            const totalPages = Math.ceil(totalBrands/limit);
            const reverseBrand = brandData.reverse();
            res.render("brands",{
                data:reverseBrand,
                currentPage:page,
                totalPages:totalPages,
                totalBrands:totalBrands
            })        
        }else{
            res.redirect("/pageerror")
        }
        
    } catch (error) {
        res.redirect("/pageerror")
    }
}



const addBrand = async (req, res) => {
    try {

        if(req.session.admin){
            console.log(req.body);
        
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }
            const brand = req.body.brandName;
            const image = req.file.filename;
    
            const newBrand = new Brand({
                brandName: brand,
                brandImage: [image],
            });
            console.log(newBrand)
            
            await newBrand.save();
            console.log(".");
            
            res.redirect("/admin/brands");        
        }else{
            return res.redirect("/pageerror")
        }
        
    } catch (error) {
        res.redirect("/pageerror");
    }
};




const blockBrand = async (req,res)=>{
    try {
        if(req.session.admin){
            const id = req.query.id;
            await Brand.updateOne({_id:id},{$set:{isBlocked:true}});
            res.redirect("/admin/brands")        
        }else{
            return res.redirect("/pageerror")
        }
        
    } catch (error) {
        res.redirect("/pageerror")
    }
}




const unBlockBrand = async (req,res)=>{
    try {
        if(req.session.admin){
            const id = req.query.id;
            await Brand.updateOne({_id:id},{$set:{isBlocked:false}});
            res.redirect("/admin/brands")        
        }else{
           return res.redirect("/pageerror")
        }
        
    } catch (error) {
        res.redirect("/pageerror")
    }
}




const deleteBrand = async (req,res)=>{
    try {
        if(req.session.admin){

            const {id} = req.query;
            if(!id){
                return res.redirect("/pageerror")
            }
            await Brand.deleteOne({_id:id});
            res.redirect("/admin/brands")
            }else{
           return res.redirect("/pageerror")
            }
        
    } catch (error) {
        console.error("error deleting brand:",error);
        res.status(500).redirect("/pageerror")
    }
}



module.exports = {
    loadBrands,
    addBrand,
    blockBrand,
    unBlockBrand,
    deleteBrand,
}