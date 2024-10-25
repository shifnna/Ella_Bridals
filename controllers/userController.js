const User = require("../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Order= require("../models/orderSchema")
const Transaction = require("../models/transactionSchema");
const Address= require("../models/addressSchema")


const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');



const pageNotFound = async (req,res) => {
    try {
        res.render("page_404")
    } catch (error) {
        res.redirect("/pageerror")
    }
}


const loadHomePage = async (req,res)=>{
    try {
        const user = req.session.user ;      
         searchQuery = req.query.search;
      const categoryId = req.query.category;
      let products;

      if (categoryId) {
        const category = await Category.findById(categoryId);
        if (!category) {
          return res.status(404).send('Category not found');
        }
  
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
  
      const categories = await Category.find({isListed:true});
      let userData = await User.findOne({_id:user});
      let wishlist = [];

      if(user){
        wishlist = userData.wishlist;
         const c = userData.cart.length;
         const w = userData.wishlist.length;

      return res.render('home', { products, user: userData, categories,c,w ,wishlist});

      }else{
        res.render('home', { c: 0, w: 0,products, user: userData, categories,wishlist });
      }

    } catch (error) {
        console.log("home page not found",error);
        res.status(500).send("server eror")
    }
}



const loadSignup = async (req, res) => {
  try {
      let message = req.query.message || '';

      return res.render("signup", { message });
  } catch (error) {
      console.log("home page not loading", error);
      res.status(500).send("server error");
      return res.redirect("/pageerror");
  }
};






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
      const { name, email, phone, password, cpassword, referalCode } = req.body;
      req.session.referalCode = referalCode;

      const user = await User.find({email:email})
      if(user.length >0){
        return res.redirect(`/signup?message=User with this email already exist`)
      }

      if(referalCode){
        const referal = await User.findOne({referenceCode:referalCode})
        if(!referal){
          return res.redirect(`/signup?message=Enter a Valid Referal Code`)
        }
      }
      
      const otp = generateOtp(6);
      const emailSend = await sendVerificationEmail(email, otp);

      if (!emailSend) {
          return res.json("email-sending-error");
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


const verifyOtp = async (req, res) => {
  try {
      const { otp } = req.body;

      // Check if OTP is in the session and compare
      if (req.session.userOtp && otp.trim() === req.session.userOtp) {
          const user = req.session.userData;
          const passwordHash = await securePassword(user.password);
          const saveUserData = new User({
              name: user.name,
              email: user.email,
              phone: user.phone,
              password: passwordHash,
          });

          // Extract the referral code from the session
          const referalCode = req.session.referalCode;

          try {
              await saveUserData.save();
          } catch (error) {
              if (error.code === 11000) {
                  return res.status(400).json({ success: false, message: "Email already exists" });
              }
              throw error; // rethrow if it's a different error
          }

          let newUserBonus = 0;
          if (referalCode) { // Check if referral code exists
              const referrerUser = await User.findOne({ referenceCode: referalCode });

              if (referrerUser) {
                  referrerUser.wallet += 100; // Assuming wallet is a field in User schema
                  await referrerUser.save();

                  // Create a new transaction
                  const transaction = new Transaction({
                      description: `Reference Benefit for ${referalCode} received`,
                      userId: referrerUser._id,
                      amount: 100,
                  });
                  await transaction.save();
                  newUserBonus = 100;
              } else {
                  console.error("No user found with the provided referral code.");
              }
          }

          saveUserData.wallet += newUserBonus;
          await saveUserData.save();

          // Transaction saving for the new user
          if (newUserBonus > 0) {
              const newUserTransaction = new Transaction({
                  description: `Welcome bonus for signing up using ${referalCode}`,
                  userId: saveUserData._id,
                  amount: newUserBonus,
              });
              await newUserTransaction.save();
          }

          req.session.user = saveUserData._id;
          res.status(200).json({ success: true, message: "otp verified", redirectUrl: '/' });      
        } else {
          res.status(400).json({ success: false, message: "Invalid OTP, please try again" });
      }
  } catch (error) {
      console.error("Error verifying OTP", error);
      res.status(500).json({ success: false, message: "An error occurred" });
  }
};




const resendOtp = async (req,res)=>{
    try {
     const {email}= req.session.userData;

     if(!email){
        return res.status(400).json({success:false,message:"Email not found in session"})
     }
    
 const otp = generateOtp(6);
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

const loadLogin = async (req, res) => {
  try {
      if (!req.session.user) {
          return res.render("login"); 
      } else {
          const user = await User.findById(req.session.user);
          
          if (user && user.isBlocked) {
              console.log("User is blocked, redirecting to login.");
              
              req.session.destroy((err) => {
                  if (err) {
                      console.error("Error destroying session:", err);
                  }
                  return res.redirect("/login"); 
              });
              return; // Prevent further execution
          }
          return res.redirect("/");
      }
  } catch (error) {
      console.error("Error loading login page:", error);
      return res.redirect("/pageerror"); 
  }
};





const login = async (req, res) => {
  try {
      const { email, password } = req.body;
      const findUser = await User.findOne({ email: email, isAdmin: false });

      if (!findUser) {
          return res.render("login", { message: "User not found" });
      }

      if (findUser.isBlocked) {
          return res.render("login", { message: "User is blocked by admin" });
      }

      if (!findUser.password) {
          return res.render("login", { message: "Password not found in database" });
      }

      const passMatch = await bcrypt.compare(password, findUser.password);

      if (!passMatch) {
          return res.render("login", { message: "Incorrect password" });
      }

      req.session.user = findUser._id;
      return res.redirect("/");
  } catch (error) {
      console.error("Login error", error);
      return res.render("login", { message: 'Login failed.. please try again' });
  }
};


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
      const categoryName = req.query.categoryName;
      const categoryId = req.query.category;
      const currentPage = parseInt(req.query.page) || 1; // Current page from query params
      const itemsPerPage = 12; // Number of items per page
      let products;

      // Determine the filter based on category and search
      let query = {};
      if (categoryId) {
          const category = await Category.findById(categoryId);
          if (!category) {
              return res.status(404).send('Category not found');
          }
          query.category = category._id;
      }else if(categoryName) {
        const category = await Category.findOne({name:categoryName});
        if (!category) {
            return res.status(404).send('Category not found');
        }
        query.category = category._id;
    }
      
      // If a search query is present
      if (searchQuery) {
          query.$or = [
              { productName: { $regex: searchQuery, $options: 'i' } },
              { description: { $regex: searchQuery, $options: 'i' } }
          ];
      }

      // Get the total count of products
      const totalProducts = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / itemsPerPage);

      // Fetch products for the current page
      products = await Product.find(query)
          .skip((currentPage - 1) * itemsPerPage)
          .limit(itemsPerPage);

      const message = req.query.message || 'none';
      const categories = await Category.find({ isListed: true });

      return res.render('shop', {
          products,
          wishlist,
          user: userData,
          categories,
          message,
          currentPage,
          totalPages
      });
  } catch (error) {
      console.log('Error loading shop page:', error.message);
      res.status(500).send('Internal Server Error');
      return res.redirect("/pageerror");
  }
};




const productDetails = async (req,res)=>{         //& load a product details page
    const productId = req.params.id;
    if( !productId){
      return res.redirect("/pageerror")
    }
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
            return res.redirect("/pageerror"); // Redirect to error page only on session destruction failure
        }
        res.clearCookie('connect.sid', { path: '/' }); // Clear the session cookie
        return res.redirect("/"); // Redirect to the login page after successful logout
    });
}



const loadResetPassword = async (req,res)=>{
    try {
      res.render("resetPassword");     
    } catch (error) {
        console.error("error occure for loading forgottpassword page",error);
        return res.redirect("/pageerror")
    }
}


const resetPassword = async (req, res) => {
    
  const userId = req.session.user; 
    const { oldpassword, newpassword, confirmpassword } = req.body;
  
    if (newpassword !== confirmpassword) {
      return res.render('resetPassword', { message3: "Password do not match" });
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.render('resetPassword', { message3: "User not found" });
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

        let user = await User.findById(userId)

        const product = await Product.findById(productId);
      if (!product) {
        return res.redirect(`/shop?message=product not found`)
      }
      if (product.isBlocked) {
        return res.redirect(`/shop?message=product is unavailable`)
      }
      if (product.quantity < 1) {
        return res.redirect(`/shop?message=product stocks left`)
      }


        if (user.wishlist.includes(productId)) {
          return res.redirect(`/shop?message=product is already in wishlist`)
        }

        user.wishlist.push(productId);
        await user.save();

        res.redirect("/shop");
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
        return res.redirect("/pageerror")
    }
  }

  const loadwishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId).populate('wishlist'); // Populate the wishlist with product details

        res.render("wishlist", {
            wishlist: user.wishlist,// Pass the populated wishlist to the template
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
        return res.redirect("/pageerror")
    }
};

const removeFromWishlist = async (req,res)=>{
    try {
        const productId = req.query.id;
        const userId = req.session.user;

        const user = await User.findById(userId);

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
        const user = await User.findById(userId).populate("transactions") // Adjust the field names as necessary
      
        const transactions = await Transaction.find({userId:userId}).sort({date:-1})
    
        // Render the wallet page and pass the user data
        res.render('wallet', {
          walletBalance: user.wallet,
          transactions: transactions || [], 
        });
      } catch (error) {
        console.error('Error retrieving wallet information:', error);
        res.status(500).send('Internal Server Error');
        return res.redirect("/pageerror")

      }
}




function numberToWords(num) {
  const belowTwenty = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", 
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", 
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];
  const aboveHundred = ["", "Thousand", "Million", "Billion"];

  if (num === 0) return belowTwenty[0];

  let words = '';
  let i = 0;

  while (num > 0) {
    let chunk = num % 1000;

    if (chunk) {
      let chunkWords = '';

      if (chunk % 100 < 20) {
        chunkWords = belowTwenty[chunk % 100];
      } else {
        chunkWords = tens[Math.floor((chunk % 100) / 10)] + (chunk % 10 ? " " + belowTwenty[chunk % 10] : "");
      }

      if (Math.floor(chunk / 100)) {
        chunkWords = belowTwenty[Math.floor(chunk / 100)] + " Hundred" + (chunk % 100 ? " " + chunkWords : "");
      }

      words = chunkWords + " " + aboveHundred[i] + " " + words;
    }

    num = Math.floor(num / 1000);
    i++;
  }

  return words.trim() + " Rupees Only";
}



const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('products');
    const doc = new jsPDF();

    // Invoice Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Womenz Store", 10, 20);
    doc.setFontSize(12);
    doc.text("3rd Floor, Kinfra, Kakkancheri", 10, 28);
    doc.text("Kakkancheri, Malappuram - 673638", 10, 34);
    doc.text("Kerala, India", 10, 40);
    doc.text("Phone: 8129616329", 10, 46);
    doc.text("GSTIN: 8s1a2d9h61ik6329", 10, 52);

    // Invoice Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 160, 20);

    // Box for Invoice Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.rect(10, 60, 190, 30);  // Box for Invoice Number, Date, etc.
    doc.text(`Invoice No: ${order._id}`, 12, 70);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 12, 80);
    doc.text(`Customer Name: ${order.address[0].username}`, 120, 70);
    doc.text(`Phone No: ${order.address[0].mobile}`, 120, 80);

    // Bill To / Ship To Headers with grey background, separate border, and vertical line
    doc.setFont("helvetica", "bold");
    doc.setFillColor(200, 200, 200);  // Grey background

    // Draw rectangles with borders for Bill To and Ship To headers
    doc.rect(10, 100, 95, 10, 'DF');  // Box for Bill To header
    doc.rect(105, 100, 95, 10, 'DF'); // Box for Ship To header
    doc.setTextColor(0, 0, 0);        // Black text color

    // Add the headers
    doc.text("Bill To", 12, 107);
    doc.text("Ship To", 110, 107);

    // Add the vertical line between Bill To and Ship To
    doc.setDrawColor(0, 0, 0);        // Black color for the line
    doc.line(105, 100, 105, 110);     // Vertical line between the two headers

    // Content Box for Bill To and Ship To (Increased height)
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);  // Reset to black for text content

    // Draw boxes around the content sections for Bill To and Ship To
    doc.rect(10, 110, 95, 40);  // Increased height for Bill To content
    doc.rect(105, 110, 95, 40); // Increased height for Ship To content

    // Bill To Section
    doc.text(doc.splitTextToSize('pakapeer', 90), 12, 118);  // Automatically wrap text
    doc.text(doc.splitTextToSize('womenz store', 90), 12, 126);
    doc.text(doc.splitTextToSize('manjeri, kerala, 676541', 90), 12, 134);
    doc.text(`Phone: 6613527220`, 12, 142);

    // Ship To Section
    doc.text(doc.splitTextToSize(order.address[0].username, 90), 110, 118);  // Automatically wrap text
    doc.text(doc.splitTextToSize(order.address[0].address, 90), 110, 126);
    doc.text(doc.splitTextToSize(`${order.address[0].city}, ${order.address[0].state} ,${order.address[0].pincode}`, 90), 110, 134);
    doc.text(`Phone: ${order.address[0].mobile}`, 110, 142);
    
    // Add a white space between Bill To/Ship To and Product Details
const gapBetweenSections = 10; // Space between sections
const productDetailsStartY = 160; // Adjusted this value for a gap (100 + 40 + gap)

// Product Details Table Header (with grey background and outer border)
doc.setFillColor(200, 200, 200);
doc.rect(10, productDetailsStartY, 190, 10, 'F');  // Grey rectangle for the header background
doc.setFont("helvetica", "bold");

// Add header text without vertical lines
doc.text("Item & Description", 12, productDetailsStartY + 7);
doc.text("Qty", 110, productDetailsStartY + 7);
doc.text("Rate", 135, productDetailsStartY + 7);
doc.text("Amount", 170, productDetailsStartY + 7);

// Draw an outer border for the header row
doc.setDrawColor(0, 0, 0); // Set the color for the border
doc.rect(10, productDetailsStartY, 190, 10); // Outer border around the header row

// **Create a gap between the headers and the product details**
const productDetailsGap = 5; // Set the desired gap size
let productDetailsContentStartY = productDetailsStartY + 12 + productDetailsGap; // Adjusting Y-coordinate for content

// Product Table Rows
doc.setFont("helvetica", "normal");
let y = productDetailsContentStartY; // Starting Y-coordinate for product rows

order.products.forEach((product) => {
  if (product.status !== 'Cancelled' && product.status !== 'Returned') {
    // Process the product item
    let productPrice = 0;
    let quantity = 1;

    if (product.offerPrice !== undefined) {
      productPrice = product.offerPrice;
    } else if (product.price !== undefined) {
      productPrice = product.price;
    }

    if (product.quantity !== undefined) {
      quantity = product.quantity;
    }

    const totalAmount = (productPrice * quantity).toFixed(2);

    doc.rect(10, y - 7, 190, 10);  // Draw box for each product row
    doc.text(doc.splitTextToSize(product.name, 90), 12, y);  // Wrap long product names
    doc.text(`${quantity}`, 110, y);
    doc.text(`Rs. ${productPrice.toFixed(2)}`, 130, y); // Show the actual price per product
    doc.text(`Rs. ${totalAmount}`, 170, y); // Show the total amount for this product
    y += 10; // Increment Y for the next product row
  }
});

   // Amount in Words and Total Amount Box
y += 10;
const totalAmount = order.totalAmount + order.couponDiscount || 0; // Assuming this is the subtotal
const discountAmount = order.couponDiscount || 0; // Get the discount amount (or 0 if not set)
const finalAmount = totalAmount - discountAmount || 0; // Calculate final amount after discount
const amountInWords = numberToWords(finalAmount); // Convert final amount to words

doc.text("Amount in words:", 10, y);
doc.text(amountInWords, 10, y + 10);

// Box for Totals (Increased height and light grey background)
y += 20;
doc.setFillColor(220, 220, 220); // Light grey background for the totals box
doc.rect(130, y, 70, 50, 'F');  // Increased height for totals box
doc.setFont("helvetica", "normal");
doc.text(`Sub Total: Rs. ${totalAmount.toFixed(2)}`, 132, y + 10);
doc.text(`Discount: Rs. ${discountAmount.toFixed(2)}`, 132, y + 20);
doc.text(`Delivery charge: Rs. 0`, 132, y + 30);
doc.text(`Total: Rs. ${finalAmount.toFixed(2)}`, 132, y + 40);


    // Footer Section
    doc.setFontSize(12);
    y += 50;
    doc.text("Company Name: Womenz Store", 10, y);
    doc.text("Authorized Signatory", 10, y + 10);
    doc.text("Thank you for your business!", 150, y + 10);

    // Output the PDF
    const pdfBuffer = doc.output();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice_${order._id}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    console.log("Error generating PDF");;
    return res.redirect("/pageerror")
  }
};


const share_refer = async (req,res)=>{
  try {
    const user = await User.findById(req.session.user);
console.log(user);

    if (!user.referenceCode) {
      // Generate a unique reference code
      referenceCode = `REF${Math.floor(Math.random() * 1000000)}`;
      // Save the new reference code in the user's schema
      user.referenceCode = referenceCode;
      await user.save(); // Ensure to save the updated user document
    } else {
      // Use the existing reference code
      referenceCode = user.referenceCode;
    }

    // Create the WhatsApp sharing link
    const message = `Hey! Use my referral code ${referenceCode} to sign up and enjoy benefits!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // Redirect to WhatsApp for sharing
    res.redirect(whatsappUrl);

  } catch (error) {
    console.error("Error generating reference code:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
    return res.redirect("/pageerror")
  }
}


async function sendEmail(userEmail, message) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_EMAIL, // Admin's email address
        pass: process.env.NODEMAILER_PASSWORD, // Admin's email password
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: userEmail.email,
      to: process.env.NODEMAILER_EMAIL, 
      subject: 'New message from user', 
      text: message,
    };

    const info = await transporter.sendMail(mailOptions);

    if (info.accepted.length > 0) {
      console.log("Successfully sent to email");
    }

    return info.accepted.length > 0;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}



const loadcontact = async (req,res)=>{
  try {
    const admin = await User.findOne({isAdmin:true});
    const address = await Address.findOne({user:admin._id});
    console.log('address',address);
    
    const email = process.env.NODEMAILER_EMAIL;

  return res.render("contact",{address,email});
  } catch (error) {
    console.log(error);
  }
}


const contact = async (req,res)=>{
  try {
    const details = req.body;
    console.log(details);

    const user = await User.findById(req.session.user)
    
    const userEmail = await User.findOne({email:user.email})
    const message = req.body.message;

    const emailSend = await sendEmail(userEmail,message);
    if (!emailSend) {
      console.log('email sending failed');
    }else{
      console.log('email sending success');
    }

  return res.redirect("/contact");
  } catch (error) {
    console.log(error);
  }
}


const loadblog = async (req,res)=>{
  try {
  return res.render("blog");
  } catch (error) {
    console.log(error);
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
    downloadInvoice,
    share_refer,
    loadcontact,
    loadblog,
    contact,
}