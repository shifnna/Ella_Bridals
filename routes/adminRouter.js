const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({storage:storage});

const adminController = require("../controllers/adminController");
const customerController = require("../controllers/customerController");
const categoryController = require("../controllers/categoryController");
const brandController = require("../controllers/brandController");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const offerController = require("../controllers/offerController");
const couponController = require("../controllers/couponController");



router.get("/login",adminController.loadLogin);
router.post("/login",adminController.login);
router.get("/dashboard",adminController.login)
router.get("/logout",adminController.logout);


router.get("/customers",customerController.loadCustomers);
router.get("/blockCustomer",customerController.customerBlocked);
router.get("/unblockCustomer",customerController.customerunBlocked);
router.get("/category",categoryController.loadCategories);
router.post("/addCategory",categoryController.addCategory);
router.get("/addCategory", (req, res) => {
    res.render('addCategory', {
        name: '',           
        description: '',  
        error: '', 
    });
});
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

router.post("/removeProductOffer",productController.removeProductOffer)
router.post("/addProductOffer",productController.addProductOffer);
router.get("/blockProduct",productController.blockProduct);
router.get("/unblockProduct",productController.unblockProduct);
router.get("/editProduct",productController.getEditProduct);
router.post("/deleteImage",productController.deleteSingleImage);
router.post("/editProduct/:id", uploads.array("images", 4), productController.editProduct);

router.get("/order",orderController.loadOrders);
router.get("/orderDetails",orderController.loadOrderDetails);
router.post("/changeStatus",orderController.changeStatus);
router.get("/offers",offerController.loadOffers);
router.get("/coupon",couponController.loadCoupons);
router.get("/addCoupon",couponController.loadAddCoupon);
router.post("/addCoupon",couponController.addCoupon);
router.get("/deleteCoupon",couponController.deleteCoupon);
router.get("/editCoupon",couponController.loadEditCoupon);
router.post("/editCoupon",couponController.editCoupon);
router.get("/addOffer",offerController.loadAddOffer);
router.post("/addOffer",offerController.addOffer);
router.get("/editOffer",offerController.loadEditOffer);
router.post("/editOffer",offerController.editOffer);
router.get("/deleteOffer",offerController.deleteOffer);
router.post('/generate-report',adminController.generateReport);
router.post('/download-pdf',adminController.generatePDFReport);
router.post('/download-excel', adminController.generateExcelReport);



// 404 Middleware for user Router
router.use((req, res) => {
    
    return res.status(404).render('page_404'); 
 });
 

module.exports = router;