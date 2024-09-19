const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const passport = require("../config/passport")
const userProfileController = require("../controllers/userProfileController");

router.get("/pageerror",userController.pageNotFound);

//signup
router.get("/",userController.loadHomePage);
router.get("/signup",userController.loadSignup);
router.post("/signup",userController.signup);
router.post("/verify-otp",userController.verifyOtp)
router.post("/resendOtp",userController.resendOtp);


//google signup
router.get("/auth/google",passport.authenticate('google',{scope:['profile','email']}));
router.get("/auth/google/callback",passport.authenticate('google',{failureRedirect:"/signup"}),(req,res)=>{
    res.redirect("/")
})

//login
router.get("/login",userController.loadLogin);
router.post("/login",userController.login);
router.get("/logout",userController.logout);
router.get("/reset-password",userController.loadResetPassword);
router.post("/reset-password",userController.resetPassword);




router.get("/shop",userController.loadShopingPage)
router.get('/productdetails/:id',userController.productDetails);
router.get("/userProfile",userProfileController.loadUserProfile);
router.get("/editProfile",userProfileController.editProfilePage);
router.post("/editProfile/:id",userProfileController.editProfile);

router.get("/addAddress",userProfileController.addAddressPage);
router.post("/addAddress/:id",userProfileController.addAddress);
router.get("/editAddress",userProfileController.editAddressPage);
router.get("/removeAddress",userProfileController.removeAddress);
router.post("/editAddress/:id",userProfileController.editAddress);

router.get("/orders",userProfileController.loadOrders);
router.get("/cart",userProfileController.cartPage)
router.get("/addToCart/:id",userProfileController.addToCart);
router.get("/removeFromCart",userProfileController.removeFromCart);

router.post("/selectAddress",userProfileController.selectAddress);
router.get("/selectPayment",userProfileController.selectPayment);
router.get("/proceedOrder",userProfileController.confirmOrder);

router.get("/orderDetails",userProfileController.loadOrderDetails);
router.get("/cancelOrder",userProfileController.cancelOrder);
router.get("/returnOrder",userProfileController.returnOrder);





module.exports = router;