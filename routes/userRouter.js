const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const passport = require("../config/passport")
const userProfileController = require("../controllers/userProfileController");
const orderController = require("../controllers/orderController");
const forgotPasswordController = require("../controllers/forgotPassword");
const { userMiddleware } = require("../middleware/middleware");


router.get("/pageerror",userController.pageNotFound);
router.get("/pageNotFound",userController.pageNotFound)
//signup
router.get("/",userController.loadHomePage);
router.get("/signup",userController.loadSignup);
router.post("/signup",userController.signup);
router.post("/verify-otp",userController.verifyOtp);
router.get("/verify-otp",(req,res)=>{res.render("verify-otp")});
router.post("/resendOtp",userController.resendOtp);


//google signup
router.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}));
router.get("/auth/google/callback",passport.authenticate('google',{failureRedirect:"/signup"}),(req,res)=>{
    console.log('hy');
    
    res.redirect("/")
})
// router.get("/auth/google/callback",passport.authenticate('google',{successRedirect:'/success', failureRedirect:"/signup"}),(req,res)=>{
//     console.log('hy');
//     res.redirect("/")
// })
//  router.get("/success",userController.success)

//login
router.get("/login",userController.loadLogin);
router.post("/login",userController.login);
router.get("/logout",userController.logout);
router.get("/reset-password",userMiddleware,userController.loadResetPassword);
router.post("/reset-password",userMiddleware,userController.resetPassword);



router.get("/home",(req,res)=>{res.redirect("/")})
router.get("/shop",userController.loadShopingPage);
router.get('/productdetails/:id',userController.productDetails);
router.get("/userProfile",userMiddleware,userProfileController.loadUserProfile);
router.get("/editProfile",userMiddleware,userProfileController.editProfilePage);
router.post("/editProfile/:id",userMiddleware,userProfileController.editProfile);
router.post("/contact",userMiddleware,userController.contact)
router.get("/contact",userMiddleware,userController.loadcontact)
router.get("/blog",userController.loadblog)


router.get("/addAddress",userMiddleware,userProfileController.addAddressPage);
router.post("/addAddress/:id",userMiddleware,userProfileController.addAddress);
router.get("/editAddress",userMiddleware,userProfileController.editAddressPage);
router.get("/removeAddress",userMiddleware,userProfileController.removeAddress);
router.post("/editAddress/:id",userMiddleware,userProfileController.editAddress);

router.get("/orders",userMiddleware,userProfileController.loadOrders);
router.get("/cart",userMiddleware,userProfileController.cartPage);
router.get("/addToCart/:id/:id2",userMiddleware,userProfileController.addToCart);
router.get("/removeFromCart",userMiddleware,userProfileController.removeFromCart);
router.post("/updateCart/:id",userMiddleware,userProfileController.updateCart)

router.get("/selectAddress",userMiddleware,userProfileController.selectAddress);
router.get("/selectPayment",userMiddleware,userProfileController.selectPayment);
router.post("/applyCoupon",userMiddleware,userProfileController.applyCoupon);
router.post("/proceedOrder",userMiddleware,userProfileController.confirmOrder);
//for retry payment
router.get("/proceedOrder",userMiddleware,userProfileController.confirmOrder2);
router.post("/verifyPayment",userMiddleware,userProfileController.verifyPayment);
router.get("/orderSuccess",userMiddleware,userProfileController.orderSuccess);
router.get("/orderFailed",userMiddleware,userProfileController.orderFailed);

router.get("/orderDetails",userMiddleware,userProfileController.loadOrderDetails);
router.get("/cancelOrder",userMiddleware,userMiddleware,userProfileController.cancelOrder);
router.get("/returnOrder",userMiddleware,userProfileController.returnOrder);

router.get("/addwishlist/:id",userMiddleware,userController.addwishlist);
router.get("/wishlist",userMiddleware,userController.loadwishlist);
router.get("/removeFromWishlist",userMiddleware,userController.removeFromWishlist);
router.get("/wallet",userMiddleware,userController.loadWallet);
router.get('/downloadInvoice/:orderId',userMiddleware,userController.downloadInvoice)

router.get("/share-refer",userMiddleware,userController.share_refer)


//^ forget password
router.get("/forgotPassword", forgotPasswordController.forgotPassword);
router.get("/verifyForgotOtp",forgotPasswordController.loadVerifyForgotOtp)
router.get("/resetPassword",userMiddleware,forgotPasswordController.resetPassword);
router.post("/sendOtp", forgotPasswordController.sendOtp);
router.post("/verifyForgotOtp", forgotPasswordController.verifyForgotOtp);
router.post("/updatePassword", forgotPasswordController.updatePassword);




// 404 Middleware for user Router
router.use((req, res) => {
    
    return res.status(404).render('page_404'); 
 });
 
module.exports = router;