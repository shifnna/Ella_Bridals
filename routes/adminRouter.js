const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({storage:storage});

const adminController = require("../controllers/adminController");
const customerController = require("../controllers/customerController");
const categoryController = require("../controllers/categoryController");
const brandController = require("../controllers/brandController");
const productController = require("../controllers/productController")



router.get("/login",adminController.loadLogin);
router.post("/login",adminController.login);
router.get("/dashboard", (req, res) => {
    if (req.session.admin) {
        res.render("dashboard");
    } else {
        res.render("page_404");
    }
});


router.get("/customers",customerController.loadCustomers);
router.get("/blockCustomer",customerController.customerBlocked);
router.get("/unblockCustomer",customerController.customerunBlocked);
router.get("/category",categoryController.loadCategories);
router.get("/addCategory",(req,res)=>{res.render("addCategory")})
router.post("/addCategory",categoryController.addCategory);
router.get("/brands",brandController.loadBrands);
router.get("/addProducts",productController.getProductAddPage);
router.get("/products",productController.loadProducts);


router.post("/addCategoryOffer",categoryController.addCategoryOffer);
router.post("/removeCategoryOffer",categoryController.removeCategoryOffer);
router.get("/listCategory",categoryController.getListCategory);
router.get("/unlistCategory",categoryController.getUnlistCategory);
router.get("/editCategory",categoryController.getEditCategory);
router.post("/editCategory/:id",categoryController.editCategory);


router.post("/addBrand",uploads.single("brandImage"),brandController.addBrand);
router.post("/addProducts",uploads.array('images',4),productController.addProducts);
router.get("/blockBrand",brandController.blockBrand);
router.get("/unBlockBrand",brandController.unBlockBrand);
router.get("/deleteBrand",brandController.deleteBrand);
router.post('/addProducts', uploads.array('images', 4), productController.addProducts);


module.exports = router;