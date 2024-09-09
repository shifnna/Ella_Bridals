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
                    // Corrected path: Navigate two levels up to reach project root
                    const originalImagePath = path.join(__dirname, '../../public/admin-assets/imgs/productImages', req.files[i].filename);
                    const resizedImagePath = path.join(__dirname, '../../public/uploads/product-images', `resized-${req.files[i].filename}`);

                    if (!fs.existsSync(originalImagePath)) {
                        console.error("File not found:", originalImagePath);
                        return res.status(400).send("File not found");
                    }

                    // Ensure the directory for resized images exists
                    const dir = path.dirname(resizedImagePath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }

                    // Resize the image and save it to the resizedImagePath
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



module.exports = {
    getProductAddPage,
    loadProducts,
    addProducts,
}