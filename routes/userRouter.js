const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");


router.get("/",userController.loadHomePage);
router.get("/signup",userController.loadSignup)



module.exports = router;