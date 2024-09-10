const Category = require("../models/categorySchema");
const Product = require("../models/productSchema");




const loadCategories = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        }
        const limit = 10;

        const categoryData = await Category.find({
            $or: [
                { name: { $regex: ".*" + search + ".*" } },
                { description: { $regex: ".*" + search + ".*" } }
            ]
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const count = await Category.find({
            $or: [
                { name: { $regex: ".*" + search + ".*" } },
                { description: { $regex: ".*" + search + ".*" } }
            ]
        }).countDocuments();

        const totalPages = Math.ceil(count / limit);

        res.render("category", {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: count,
            search: search
        });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
}





const addCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            req.flash('error', 'Category already exists');
            return res.redirect('/admin/addCategory');
        }
        const newCategory = new Category({ name, description });
        await newCategory.save();
        req.flash('success', 'Category added successfully');
        return res.redirect('/admin/addCategory'); // Redirect to the category page or form page
    } catch (error) {
        console.error(error);
        req.flash('error', 'Internal server error');
        return res.redirect('/admin/addCategory');
    }
}




const addCategoryOffer = async (req,res)=>{
    try {
        const percentage = parseFloat(req.body.percentage)
        const categoryId = req.body.categoryId;
        const category = await Category.findById(categoryId);

        if(!category){
            return res.status(400).json({status:false,message:"Category not found"})
        }

        const products = await Product.find({category:category._id});
        const hasProductOffer = products.some((product)=>product.productOffer > percentage);

        if(hasProductOffer){
            return res.json({status:false,message:"products within this categoty already already have product offers"})
        }
        await Category.updateOne({_id:categoryId},{$set:{categoryOffer:percentage}})

        for(const product of products){
            product.productOffer=0,
            product.salePrice=product.regularPrice;
            await product.save()
        }
        res.json({status:true})
    } catch (error) {
        console.error('Error adding category offer:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
            }
}




const removeCategoryOffer = async (req,res)=>{
    try {
        const categoryId = req.body.categoryId;
        console.log("Received categoryId:", categoryId);
        const category = await Category.findById(categoryId);

        if(!category){
          return  res.status(404).json({status:false,message:"category not found"})
        }

        const percentage = category.categoryOffer;
        const products = await Product.find({category:category._id});

        if(products.length > 0){
            for (const product of products) {
                product.salePrice = product.regularPrice //- Math.floor(product.regularPrice * (percentage / 100));
                product.productOffer = 0;
                await product.save();
            }

        }
        category.categoryOffer = 0;
        await category.save();

        res.json({status:true})
    } catch (error) {
        console.error("Error removing category offer:", error);
        res.status(500).json({status:false,message:"Internal server error"})
    }
}




const getListCategory = async (req,res)=>{
    try {
        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:true}});
        res.redirect("/admin/category")
    } catch (error) {
        res.redirect("/pageerror")
    }
}




const getUnlistCategory = async (req,res)=>{
    try {
        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:false}});
        res.redirect("/admin/category")
    } catch (error) {
        res.redirect("/pageerror");
    }
}







const getEditCategory = async (req,res)=>{
    try {
        let id = req.query.id;
       const category = await Category.findOne({_id:id});
        res.render("editCategory",{category:category})
    } catch (error) {
        res.redirect("/pageerror");
    }
}




const editCategory = async (req,res)=>{
    try {
        const id=req.params.id;
        const {categoryName,description} = req.body;
        const existingCategory = await Category.findOne({name:categoryName});

        if(existingCategory){
           return res.status(400).json({error:"Category exist, please choose another name"})
        }

        const updateCategory = await Category.findByIdAndUpdate(id,{
            name:categoryName,
            description:description,

        },{new:true});

        if(updateCategory){
            res.redirect("/admin/category")
        }else{
            res.status(404).json({error:"Category not found"})
        }

    } catch (error) {
        res.status(500).json({error:"internal Server Error"})
    }
}


module.exports = {
    loadCategories,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory,
}

