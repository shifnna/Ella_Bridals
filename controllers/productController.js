const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Brand = require("../models/brandSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
// productController.js

const getProductAddPage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });
        res.render("addProducts", {
            cat: category,
            brand: brand,
        });
    } catch (error) {
        console.error("Error loading product add page:", error);
        res.redirect("/pageerror");
    }
};


const loadProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = 4;

        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
            ],
        }).limit(limit * 1).skip((page - 1) * limit).populate('category').exec()


        const count = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
            ],
        }).countDocuments();


        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });


        if (category && brand) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category,
                brand: brand,
                search: search
            })
        } else {
            res.render("page_404")
        }
    } catch (error) {
        res.render("products")
    }
}


const addProducts = async (req, res) => {
    try {
        const products = req.body;
        const productExists = await Product.findOne({
            productName: products.productName,
        });

        if (!productExists) {
            const images = [];

            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = path.join(__dirname, '../public/imgs/productImages', req.files[i].filename);
                    const resizedImagePath = path.join(__dirname, '../public/imgs/re-images', `resized-${req.files[i].filename}`);

                    // Validate image format
                    const validFormats = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'gif'];
                    const fileExtension = path.extname(req.files[i].filename).toLowerCase().replace('.', '');

                    if (!validFormats.includes(fileExtension)) {
                        console.error("Unsupported image format:", fileExtension);
                        return res.status(400).send("Unsupported image format");
                    }

                    // Ensure the directory for resized images exists
                    const dir = path.dirname(resizedImagePath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    // Resize the image using sharp
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagePath);

                    images.push(`resized-${req.files[i].filename}`);
                }
            }

            const categoryId = await Category.findOne({ name: products.category });
            if (!categoryId) {
                return res.status(400).json('Invalid category name');
            }

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                brand: products.brand,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                color: products.color,
                size: products.size,
                productImage: images,
                status: 'Available',
            });

            await newProduct.save();
            return res.redirect("/admin/addProducts");
        } else {
            return res.status(400).json("Product already exists. Please try with another name.");
        }
    } catch (error) {
        console.error("Error saving product:", error);
        return res.redirect("/pageerror");
    }
};





const addProductOffer = async (req, res) => {
    try {
        const { productId, percentage } = req.body;
        const findProduct = await Product.findOne({ _id: productId });
        const findCategory = await Category.findOne({ _id: findProduct.category });

        if (findCategory.categoryOffer > percentage) {
            return res.json({ status: false, message: "This product's category already has a category offer" })
        }

        findProduct.offerPrice = findProduct.salePrice - Math.floor(findProduct.regularPrice * (percentage / 100));
        findProduct.offerPercentage = parseInt(percentage);

        await findProduct.save();
        findCategory.categoryOffer = 0;
        await findCategory.save();
        res.json({ status: true });
    } catch (error) {
        res.redirect("/pageerror");
        return res.status(500).json({ status: true, message: "Internal server error" })
    }
}

const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body;
        const findProduct = await Product.findOne({ _id: productId });
        const percentage = findProduct.productOffer;
        findProduct.salePrice = findProduct.salePrice + Math.floor(findProduct.regularPrice * (percentage / 100));
        findProduct.productOffer = 0;
        await findProduct.save();
        res.json({ status: true })
    } catch (error) {
        res.redirect("/pageerror");
    }
}

const blockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
        res.redirect("/admin/products");

    } catch (error) {
        res.redirect("/pageerror")
    }
}

const unblockProduct = async (req, res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect("/admin/products");

    } catch (error) {
        res.redirect("/pageerror")
    }
}



const getEditProduct = async (req,res)=>{
    try {
        const id= req.query.id;
        const product = await Product.findOne({_id:id});
        const category = await Category.find({});
        const brand = await Brand.find({});
 
        
        res.render("edit-product",{
            product:product,
            cat:category,
            brand:brand
        })
    } catch (error) {
        res.redirect("/pageerror")
    }
}




const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToserver } = req.body;
        const product = await Product.findByIdAndUpdate(productIdToserver, { $pull: { productImage: imageNameToServer } });
        
        // Corrected path: Navigate two levels up to reach project root
        const imagePath = path.join(__dirname, '../public/imgs/productImages', imageNameToServer);

        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`);
        } else {
            console.log("Image Path:", imagePath);
            console.log(`Image ${imageNameToServer} not found`);
        }

        res.send({ status: true })
    } catch (error) {
        res.redirect("/pageerror")
    }
}



const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        // if (req.session.admin) {
            const product = await Product.findById(id);
            const data = req.body;

            const images = [];

            // If files are provided, process the uploaded images
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = path.join(__dirname, '../public/imgs/productImages', req.files[i].filename);
                    const resizedImagePath = path.join(__dirname, '../public/imgs/re-images', `resized-${req.files[i].filename}`);

                    if (!fs.existsSync(originalImagePath)) {
                        console.error("File not found:", originalImagePath);
                        return res.status(400).send("File not found");
                    }

                    // Ensure directory for resized images exists
                    const dir = path.dirname(resizedImagePath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    // Resize the image
                    await sharp(originalImagePath)
                        .resize({ width: 440, height: 440 })
                        .toFile(resizedImagePath);

                    images.push(`resized-${req.files[i].filename}`);
                }
            }

            // Update fields
            const updateFields = {
                productName: data.productName,
                description: data.description,
                brand: data.brand,
                category: data.category,
                regularPrice: data.regularPrice,
                salePrice: data.salePrice,
                quantity: data.quantity,
                size: data.size,
                color: data.color,
                offerPercentage: data.offerPercentage,
                offerPrice: data.offerPrice,
            };

            // If new images are uploaded, add them to the update object
            if (images.length > 0) {
                updateFields.$push = { productImage: { $each: images } };
            }

            // Update product details
            await Product.findByIdAndUpdate(id, updateFields, { new: true });
            res.redirect("/admin/products");
        // } else {
            
        //     res.redirect("/pageerror");
        // }

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};



module.exports = {
    getProductAddPage,
    loadProducts,
    addProducts,
    addProductOffer,
    removeProductOffer,
    blockProduct,
    unblockProduct,
    getEditProduct,
    deleteSingleImage,
    editProduct,
}