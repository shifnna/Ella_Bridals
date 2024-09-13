const User = require("../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const Product = require("../models/productSchema");
const Address = require("../models/addressSchema");
const Cart = require('../models/CartSchema');



const loadUserProfile = async (req, res) => {
  try {
    const userId = req.session.user;
    // console.log(`User ID: ${userId}`);

    if (userId) {
      const userData = await User.findById(userId);
      const addresses = await Address.find({ user: req.session.user }).exec(); 
console.log("userData:",userData);
console.log("addresses:",addresses);


      return res.render("profile", { user: userData, addresses: addresses });
    } else {
     return res.redirect("/pageerror")
    }
  } catch (error) {
    console.log("profile page not found", error);
    res.status(500).send("server error");
  }
}



  const editProfilePage = async (req,res)=>{
    try {
        const userId = req.query.id;
        const profile = await User.findOne({_id:userId})

        res.render("edit-profile", { data: profile });
    } catch (error) {
        console.log("profile edit page not found", error);
      res.status(500).send("server error");
    }
  }



  const editProfile = async (req,res)=>{
    try {
        const id = req.params.id;
        const userId = await User.findById(id)

        const data = req.body;

        const updateUserData = {
            name : data.name,
            email:data.email,
            phone:data.phone,
        }

        await User.findByIdAndUpdate(id,updateUserData,{new:true});
        res.redirect("/userProfile");

    } catch (error) {
         console.error(error);
        res.redirect("/pageerror")
    }
  }



  const addAddressPage = async (req,res)=>{
    try {
      // const userId = req.query.id;
      const userId = req.session.user;

      const usermodel = await User.findOne({_id:userId})

      res.render("add-address", { data: usermodel });
  } catch (error) {
      console.log("profile edit page not found", error);
    res.status(500).send("server error");
  }

  }



  const addAddress = async (req,res)=>{
    try {
      const id = req.params.id;
      const {name,phone,address,city,state,postalCode,country} = req.body;

      const newAddress = new Address({
        user:id,     //^ as address schema
        address:[{
          name,
          phone,
          address,
          city,
          state,
          postalCode,
          country
        }],
      });

      await newAddress.save();
    return res.redirect("/userProfile");

    } catch (error) {
      console.error("Error adding address:", error);
      res.status(500).json({
          message: 'Error adding address',
          error: error.message
      });
    }
  }



  const editAddressPage = async (req, res) => {
    try {
      const addressId = req.query.addressId;
      const userId = req.query.id;
  
      const address = await Address.findOne({ user: userId });
      const addr = address.address; // addr is an array of addresses
  
      // Access the address in the array
      const targetAddress = addr.find((address) => address._id.toString() === addressId);
  
      console.log(targetAddress);
  
      // Now you can render the edit-address template with the targetAddress
      res.render("edit-address", { address: targetAddress });
    } catch (error) {
      // handle error
    }
  };


  const editAddress = async (req, res) => {
    try {
      const addressId = req.params.id;
      
      console.log(addressId);
      const { name, phone, address, city, state, postalCode, country } = req.body;
  
      const editedAddress = {
        name,
        phone,
        address,
        city,
        state,
        postalCode,
        country
      };
  
      
    const result = await Address.findOneAndUpdate(
      { "address._id": addressId },
      { $set: { "address.$.name": editedAddress.name, "address.$.phone": editedAddress.phone, "address.$.address": editedAddress.address, "address.$.city": editedAddress.city, "address.$.state": editedAddress.state, "address.$.postalCode": editedAddress.postalCode, "address.$.country": editedAddress.country } },
      { new: true }
    );

      res.redirect("/userProfile");
    } catch (error) {
      console.error(error.message);
    }
  };



  const removeAddress = async (req,res)=>{
    try {
      const addressId = req.query.addressId;
      
      console.log(addressId);
      const { name, phone, address, city, state, postalCode, country } = req.body;
  
      const editedAddress = {
        name,
        phone,
        address,
        city,
        state,
        postalCode,
        country
      };
  
      
    const result = await Address.findOneAndDelete(
      { "address._id": addressId },
      { $set: { "address.$.name": editedAddress.name, "address.$.phone": editedAddress.phone, "address.$.address": editedAddress.address, "address.$.city": editedAddress.city, "address.$.state": editedAddress.state, "address.$.postalCode": editedAddress.postalCode, "address.$.country": editedAddress.country } },
      { new: true }
    );

      res.redirect("/userProfile");
    } catch (error) {
      console.error(error.message);
      
    }
  }



  const loadOrders = async (req,res)=>{
    try {
      const userId = req.session.user;
    console.log(`User ID: ${userId}`);

    if (userId) {
//       const userData = await User.findById(userId);
//       const addresses = await Address.find({ user: req.session.user }).exec(); 
// console.log("userData:",userData);
// console.log("addresses:",addresses);
      return res.render("orders");

    } else {
     return res.redirect("/pageerror")
    }
  } catch (error) {
    console.log("profile page not found", error);
    res.status(500).send("server error");
  }
  }




 const cartPage = async (req,res)=>{
    try {
      const userId = req.session.user;
      if(userId){
        const user = await User.findById(userId);

        const cart = await Cart.findOne({ user: userId }).populate('products.product');  // Populates product details in cart
        res.render("cart",{user:user,cart: cart ? cart.products : [],totalPrice: cart ? cart.totalPrice : 0 })
  
      }else{
          res.redirect("/login")
      }
     

    } catch (error) {
      
    }
  }

  
const addToCart = async (req,res)=>{
    try {
      const userId = req.session.user; 

      if(userId){
        const productId = req.params.id;
        const quantity = req.body.quantity || 1;
  
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }
  
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({
                user: userId,
                products: [],
                totalPrice: 0,
                
            });
        }
         // Check if the product already exists in the cart
        const existingProductIndex = cart.products.findIndex(item => item.product.toString() === productId);
  
        if (existingProductIndex > -1) {
          // Product already in the cart, update the quantity
          cart.products[existingProductIndex].quantity += quantity;
      } else {
          cart.products.push({
              product: productId,
              quantity,
              price: product.salePrice || product.regularPrice 
          });
      }
  
    cart.totalPrice = cart.products.reduce((total, item) => {
        return total + item.quantity * item.price; }, 0);
  
    await cart.save();
  
    console.log("added to cart");
    res.redirect("/shop")
     
  }else{
    res.redirect("/login")
  }
      
    } catch (error) {
      console.log("adding cart error found", error);
      res.status(500).send("server error");
    }
    
  }




  const removeFromCart = async (req, res) => {
    try {
      const userId = req.session.user;
      const productId = req.query.productId;
  
      if (userId) {
        let cart = await Cart.findOneAndUpdate(
          { user: userId },
          { $pull: { products: { _id: productId } } },
          { new: true }
        );
  
        if (!cart) {
          return res.status(404).send('Cart not found');
        }
  
        console.log("Product removed from cart");
        res.redirect("/cart");
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      console.log("Removing from cart error found", error);
      res.status(500).send("Server error");
    }
  };



  const selectAddress = async (req,res)=>{
    try {
        const userId = req.session.user;
        // console.log(`User ID: ${userId}`);
    
        if (userId) {
          const userData = await User.findById(userId);
          const addresses = await Address.find({ user: req.session.user }).exec(); 
    console.log("userData:",userData);
    console.log("addresses:",addresses);
    
    
          return res.render("selectAddress", { user: userData, addresses: addresses });
        } else {
         return res.redirect("/pageerror")
        }
      } catch (error) {
        console.log("profile page not found", error);
        res.status(500).send("server error");
      }
    
  }


  const selectPayment = async (req,res)=>{
    try {
      const userId = req.session.user;
      // console.log(`User ID: ${userId}`);
  
      if (userId) {
       
        return res.render("selectPayment");
      } else {
       return res.redirect("/pageerror")
      }
    } catch (error) {
      console.log("profile page not found", error);
      res.status(500).send("server error");
    }
  
  }
module.exports = {
    loadUserProfile,
    editProfilePage,
    editProfile,
    addAddressPage,
    addAddress,
    editAddressPage,
    removeAddress,
    editAddress,
    loadOrders,
    addToCart,
    cartPage,
    removeFromCart,
    selectAddress,
    selectPayment,
}
