const User = require("../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");


const pageNotFound = async (req,res) => {
    try {
        res.render('page_404')
    } catch (error) {
        res.redirect()
    }
}


const loadHomePage = async (req,res)=>{
    try {
        const user = req.session.user ;

        if(user){
         const userData = await User.findOne({_id:user});
         const c = userData.cart.length;
         const w = userData.wishlist.length;

         res.render("home",{user:userData,c,w});
        }else{
        res.render('home', { c: 0, w: 0 });
        }
    } catch (error) {
        console.log("home page not found",error);
        res.status(500).send("server eror")
    }
}



const loadSignup = async (req,res) => {
    try {
        return res.render("signup")
    } catch (error) {
        console.log("home page not loading",error);
        res.status(500).send("server error")
        
    }
}





function generateOtp(length) {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);  // Generates a digit between 0 and 9
    }
    return otp;
}


async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify Your Account",
            text: `Your OTP is ${otp}`,
        });

        if (info.accepted.length > 0) {
            console.log("Successfully sent to email");
        }

        return info.accepted.length > 0;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}


function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}


const signup = async (req, res) => {
    try {
        const { name, email, phone, password, cpassword } = req.body;

        if (password !== cpassword) {
            return res.render("signup", { message: "Passwords do not match" });
        }

        if (!validateEmail(email)) { // Add this function to validate email format
            return res.render("signup", { message: "Invalid email format" });
        }

        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("signup", { message: "User with this email already exists" });
        }

        const otp = generateOtp(6);
        const emailSend = await sendVerificationEmail(email, otp);

        if (!emailSend) {
            return res.json("email-error");
        }

        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password };

        res.render("verify-otp");
        console.log("OTP sent:", otp);
    } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).send("Internal server error");
    }
};





const securePassword = async (password)=>{
    try {
       const passwordHash = await bcrypt.hash(password, 10);
       return passwordHash;
    } catch (error) {
       
    }
}

const verifyOtp = async (req,res)=>{
    try {
        const {otp} = req.body;
        console.log(otp);

        if(otp===req.session.userOtp){
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);
            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            })
            await saveUserData.save();
            req.session.user = saveUserData. _id,
            res.json({success:true,redirectUrl:"/"});
        }else{
            res.status(400).json({success:false , message:"invalid OTP, please try again"});
          
        }
        
    } catch (error) {
        console.error("error verifying otp",error);
        res.status(500).json({success:false,message:"an error occure"})
            
    }
}



const resendOtp = async (req,res)=>{
    try {
     const {email}= req.session.userData;

     if(!email){
        return res.status(400).json({success:false,message:"Email not found in session"})
     }
    
 const otp = generateOtp();
 req.session.userOtp = otp;


 const emailSent = await sendVerificationEmail(email,otp);
 if(emailSent){
     console.log("resend OTP:",otp);
     res.status(200).json({success:true,message:'OTP Resend successful'});
 }else{
     res.status(500).json({success:false,message:'Failed to ResendOTP, please try again..'})
 }

    } catch (error) {
     console.error("Failed to Resend OTP",error);
     res.status(500).json({success:false,message:'internal Server Error, please try again'})
     
    }
}


const loadLogin = async (req,res)=>{
    try {
        if(!req.session.user){
            return res.render("login")
        }else{
            redirect("/");
        }
     } catch (error) {
        res.redirect("/pageNotFound")
     }
}



const login = async (req,res)=>{
     try {
        const {email,password} = req.body;
        const findUser =await User.findOne({email:email,isAdmin:false});
        
        if(!findUser){
            return res.render("login",{message:"User not found"});
        }

        if(findUser.isBlocked){
            return res.render("login",{message:"User is blocked by admin"})
        }

        if (!findUser.password) {
            return res.render("login", { message: "Password not found in database" });
        }

        const passMatch = await bcrypt.compare(password, findUser.password);

        if(!passMatch){
            return res.render("login",{message:"incorrect password"});
        }

        req.session.user = findUser._id;
        res.redirect("/");
     } catch (error) {
        console.error("login error",error);
        res.render("login",{message:'login failed.. please try again'})
     }
}


const loadShopingPage = async (req, res) => {
    try {
      const user = req.session.user;
      let userData = null;
      let wishlist = [];
  
      if (user) {
        userData = await User.findOne({ _id: user });
        wishlist = userData.wishlist;
      }

      const searchQuery = req.query.search;
      const categoryId = req.query.category;
      let products;
    //   console.log("search : ",searchQuery);

      if (categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
          return res.status(404).send('Category not found');
        }
  
        // If a search query is present, filter products by name or description
        if (searchQuery) {
          products = await Product.find({
            category: category._id,
            $or: [
              { productName: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search
              { description: { $regex: searchQuery, $options: 'i' } }
            ]
          });
        } else {
          products = await Product.find({ category: category._id });
        }
  
      } else {
        // If no category is selected but there's a search query
        if (searchQuery) {
          products = await Product.find({
            $or: [
              { productName: { $regex: searchQuery, $options: 'i' } },
              { description: { $regex: searchQuery, $options: 'i' } }
            ]
          });
        } else {
          products = await Product.find();
        }
      }
  
      const message = req.query.message || 'none';

      const categories = await Category.find({isListed:true});
      return res.render('shop', { products, wishlist, user: userData, categories,message });
    } catch (error) {
      console.log('Error loading home page:', error.message);
      res.status(500).send('Internal Server Error');
    }
  };



const productDetails = async (req,res)=>{         //& load a product details page
    const productId = req.params.id;
  console.log("product id is:",productId);

    const details = await Product.findOne({_id:productId});
console.log(details);

    if(details){
        res.render("productDetails",{data:details});
    }else{
        console.log("product with that product id is not found");
        
    }
}



const logout = async (req,res)=>{
    req.session.destroy((err) => {
        if (err) {
            console.log("Error destroying session:", err);
            return res.redirect("/admin/pageerror"); // Redirect to error page only on session destruction failure
        }
        res.clearCookie('connect.sid', { path: '/' }); // Clear the session cookie
        return res.redirect("/"); // Redirect to the login page after successful logout
    });
}



const loadResetPassword = async (req,res)=>{
    try {
        if(req.session.user){
            res.render("resetPassword");
        }else{
            res.redirect("/pageerror")
        }
    } catch (error) {
        console.error("error occure for loading forgottpassword page",error);
        
    }
}


const resetPassword = async (req, res) => {
    const { oldpassword, newpassword, confirmpassword } = req.body;
  
    if (newpassword !== confirmpassword) {
      return res.render('resetPassword', { message3: "Password do not match" });
    }
  
    const userId = req.session.user;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
  
      const isPasswordMatch = await bcrypt.compare(oldpassword, user.password);
      if (!isPasswordMatch) {
        return res.render("resetPassword", { message1: "Incorrect old password" });
      }
  
      const passwordHash = await securePassword(newpassword);
      user.password = passwordHash;
  
      await user.save();
      return res.render("resetPassword", { message: "Password updated successfully" });
  
    } catch (error) {
      console.log(error.message);
      return res.render('profile', { message: "An error occurred. Please try again later." });
    }
  }


  const addwishlist = async (req,res)=>{
    try {
        const userId = req.session.user;
        const productId = req.params.id; 

        const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).send('Product not found');
      }
      if (product.isBlocked===true) {
        return res.status(404).send('Product not available');
      }
      if (product.quantity < 1) {
        return res.status(404).send('Stocks Left');
      }

        const user = await User.findById(userId);
        if (!user) {
           res.redirect("/login");
        }

        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        user.wishlist.push(productId);
        await user.save();

        res.redirect("/shop");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
  }

  const loadwishlist = async (req, res) => {
    try {
        const userId = req.session.user;

        const user = await User.findById(userId).populate('wishlist'); // Populate the wishlist with product details

        if (!user) {
            return res.redirect("/login"); 
        }
        res.render("wishlist", {
            wishlist: user.wishlist,// Pass the populated wishlist to the template
           
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

const removeFromWishlist = async (req,res)=>{
    try {
        const productId = req.query.id;
        const userId = req.session.user;

        const user = await User.findById(userId);

        if (!user) {
           res.redirect("/login");
        }

        user.wishlist.pull(productId);
        user.save();

        res.redirect("/wishlist")

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
}

const loadWallet = async (req,res)=>{
    try {
        const userId = req.session.user; // Assuming user ID is stored in session
        const user = await User.findById(userId).select('wallet transactions'); // Adjust the field names as necessary
    
        if (!user) {
          return res.status(404).send('User not found');
        }
    
        // Render the wallet page and pass the user data
        res.render('wallet', {
          walletBalance: user.wallet,
        //   transactions: user.transactions || [] // Assuming transactions is an array of transaction details
        });
      } catch (error) {
        console.error('Error retrieving wallet information:', error);
        res.status(500).send('Internal Server Error');
      }
}
module.exports = {
    pageNotFound,
    loadHomePage,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    loadShopingPage,
    productDetails,
    logout,
    loadResetPassword,
    resetPassword,
    addwishlist,
    loadwishlist,
    removeFromWishlist,
    loadWallet,
}