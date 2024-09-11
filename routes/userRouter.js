const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const passport = require("../config/passport")


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
router.post("/login",userController.login)


router.get("/shop",userController.loadShopingPage)
router.get('/productdetails/:id',userController.productDetails);

module.exports = router;