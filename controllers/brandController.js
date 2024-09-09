const Brand = require("../models/brandSchema");
const product = require("../models/productSchema");



const loadBrands = async (req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
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
    } catch (error) {
        res.redirect("/pageerror")
    }
}



const addBrand = async (req, res) => {
    try {
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
    } catch (error) {
        res.redirect("/pageerror");
    }
};







module.exports = {
    loadBrands,
    addBrand,
}