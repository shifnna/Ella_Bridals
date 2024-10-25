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
const { adminMiddleware } = require("../middleware/middleware");



router.get("/login",adminController.loadLogin);
router.post("/login",adminController.login);
router.get("/dashboard",adminMiddleware,adminController.login)
router.get("/logout",adminMiddleware,adminController.logout);


router.get("/customers",adminMiddleware,customerController.loadCustomers);
router.get("/blockCustomer",adminMiddleware,customerController.customerBlocked);
router.get("/unblockCustomer",adminMiddleware,customerController.customerunBlocked);
router.get("/category",adminMiddleware,categoryController.loadCategories);
router.post("/addCategory",adminMiddleware,categoryController.addCategory);
router.get("/addCategory", (req, res) => {
    res.render('addCategory', {
        name: '',           
        description: '',  
        error: '', 
    });
});
router.get("/brands",adminMiddleware,brandController.loadBrands);
router.get("/addProducts",adminMiddleware,productController.getProductAddPage);
router.get("/products",adminMiddleware,productController.loadProducts);


router.post("/addCategoryOffer",adminMiddleware,categoryController.addCategoryOffer);
router.post("/removeCategoryOffer",adminMiddleware,categoryController.removeCategoryOffer);
router.get("/listCategory",adminMiddleware,categoryController.getListCategory);
router.get("/unlistCategory",adminMiddleware,categoryController.getUnlistCategory);
router.get("/editCategory",adminMiddleware,categoryController.getEditCategory);
router.post("/editCategory/:id",adminMiddleware,categoryController.editCategory);


router.post("/addBrand",adminMiddleware,uploads.single("brandImage"),brandController.addBrand);
router.post("/addProducts",adminMiddleware,uploads.array('images',4),productController.addProducts);
router.get("/blockBrand",adminMiddleware,brandController.blockBrand);
router.get("/unBlockBrand",adminMiddleware,brandController.unBlockBrand);
router.get("/deleteBrand",adminMiddleware,brandController.deleteBrand);
router.post('/addProducts',adminMiddleware, uploads.array('images', 4), productController.addProducts);

router.post("/removeProductOffer",adminMiddleware,productController.removeProductOffer)
router.post("/addProductOffer",adminMiddleware,productController.addProductOffer);
router.get("/blockProduct",adminMiddleware,productController.blockProduct);
router.get("/unblockProduct",adminMiddleware,productController.unblockProduct);
router.get("/editProduct",adminMiddleware,productController.getEditProduct);
router.post("/deleteImage",adminMiddleware,productController.deleteSingleImage);
router.post("/editProduct/:id",adminMiddleware, uploads.array("images", 4), productController.editProduct);

router.get("/order",adminMiddleware,orderController.loadOrders);
router.get("/orderDetails",adminMiddleware,orderController.loadOrderDetails);
router.post("/changeStatus",adminMiddleware,orderController.changeStatus);
router.get("/offers",adminMiddleware,offerController.loadOffers);
router.get("/coupon",adminMiddleware,couponController.loadCoupons);
router.get("/addCoupon",adminMiddleware,couponController.loadAddCoupon);
router.post("/addCoupon",adminMiddleware,couponController.addCoupon);
router.get("/deleteCoupon",adminMiddleware,couponController.deleteCoupon);
router.get("/editCoupon",adminMiddleware,couponController.loadEditCoupon);
router.post("/editCoupon",adminMiddleware,couponController.editCoupon);
router.get("/addOffer",adminMiddleware,offerController.loadAddOffer);
router.post("/addOffer",adminMiddleware,offerController.addOffer);
router.get("/editOffer",adminMiddleware,offerController.loadEditOffer);
router.post("/editOffer",adminMiddleware,offerController.editOffer);
router.get("/deleteOffer",adminMiddleware,offerController.deleteOffer);
router.post('/generate-report',adminMiddleware,adminController.generateReport);
router.post('/download-pdf',adminMiddleware,adminController.generatePDFReport);
router.post('/download-excel',adminMiddleware, adminController.generateExcelReport);



// 404 Middleware for user Router
router.use((req, res) => {
    
    return res.status(404).render('page_404'); 
 });
 

module.exports = router;