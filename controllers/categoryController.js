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
            .sort({ name:-1 })
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
  
    // Trim inputs
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
  
    try {
      let error = null;
  
      if (!trimmedName) {
        error = 'Name is required.';
      } else if (trimmedName.length < 3) {
        error = 'Name must be at least 3 characters long.';
      }
  
      if (!error && !trimmedDescription) {
        error = 'Description is required.';
      } else if (!error && trimmedDescription.length < 5) {
        error = 'Description must be at least 5 characters long.';
      }
  
      if (error) {
        return res.render('addCategory', {
          name: trimmedName,
          description: trimmedDescription,
          error
        });
      }
  
      // Check for existing category
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } // Case-insensitive check
      });
  
      if (existingCategory) {
        error = 'Category name already exists.';
        return res.render('addCategory', {
          name: trimmedName,
          description: trimmedDescription,
          error
        });
      }
  
      const newCategory = new Category({ name: trimmedName, description: trimmedDescription });
      await newCategory.save();
      return res.redirect("/admin/category");
    } catch (error) {
      console.error(error);
      return res.render('addCategory', {
        name: trimmedName,
        description: trimmedDescription,
        error: 'Internal server error'
      });
    }
  };




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
        res.render("editCategory",{category:category,error:''})
    } catch (error) {
        res.redirect("/pageerror");
    }
}



const editCategory = async (req, res) => {
    try {
      const id = req.params.id;
      const { categoryName, description } = req.body;
  
      const trimmedCategoryName = categoryName.trim();
      const trimmedDescription = description.trim();
  
      let error = null;
  
      if (!trimmedCategoryName) {
        error = { type: 'error', text: 'Category name is required.' };
      } else if (!trimmedDescription) {
        error = { type: 'error', text: 'Description is required.' };
      }
  
      if (error) {
        return res.render("editCategory", {
          category: { _id: id, name: trimmedCategoryName, description: trimmedDescription },
          error
        });
      }
  
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${categoryName}$`, 'i') }, // Case insensitive regex
        _id: { $ne: id } // Exclude the current category
      });
  
      if (existingCategory) {
        error = { type: 'error', text: 'Category exists, please choose another name' };
        return res.render("editCategory", {
          category: { _id: id, name: categoryName, description }, // Retain the current category data
          error
        });
      }
  
      const updatedCategory = await Category.findByIdAndUpdate(id, {
        name: categoryName,
        description: description,
      }, { new: true });
  
      if (updatedCategory) {
        return res.redirect("/admin/category");
      } else {
        error = { type: 'error', text: 'Category not found' };
        return res.render("editCategory", {
          category: { _id: id, name: categoryName, description },
          error
        });
      }
    } catch (error) {
      console.error("Error updating category:", error);
      return res.status(500).render("editCategory", {
        category: { _id: req.params.id, name: req.body.categoryName, description: req.body.description },
        error: { type: 'error', text: 'Internal Server Error' }
      });
    }
  };


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

