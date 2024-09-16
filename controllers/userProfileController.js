const User = require("../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const Product = require("../models/productSchema");
const Address = require("../models/addressSchema");
const Cart = require('../models/CartSchema');
const Order = require("../models/orderSchema")



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
    // console.log(`User ID: ${userId}`);

    if (userId) {
      const orders = await Order.find({ userId:userId });
console.log("orders:",orders);
      return res.render("orders",{orders:orders});

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

  const addToCart = async (req, res) => {
    try {
      const userId = req.session.user;
      const productId = req.params.id;
      const quantity = parseInt(req.body.quantity, 10) || 1; // Ensure quantity is a number and defaults to 1 if not provided
  
      if (!userId) {
        return res.redirect("/login");
      }
  
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).send('Product not found');
      }
      if (product.isBlocked===true) {
        return res.status(404).send('Product not available');
      }
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        cart = new Cart({
          user: userId,
          products: [],
          totalPrice: 0,
        });
      }
  
      const existingProductIndex = cart.products.findIndex(item => item.product.toString() === productId);
  
      if (existingProductIndex > -1) {
        // Product already in the cart, update the quantity
        const existingProduct = cart.products[existingProductIndex];
        existingProduct.quantity += quantity;
  
        // Check if updated quantity exceeds stock
        if (existingProduct.quantity > product.stock) {
          return res.status(400).send('Insufficient stock');
        }
      } else {
        if (quantity > product.stock) {
          return res.status(400).send('Insufficient stock');
        }
  
        cart.products.push({
          product: productId,
          quantity: quantity,
          name:product.productName,
          productImage : product.productImage[0],
          price: product.salePrice || product.regularPrice,
          stock: product.quantity,
          brand:product.brand,
          size:product.size,
          color:product.color,
        });
      }
  
      // Calculate total price
      cart.totalPrice = cart.products.reduce((total, item) => {
        return total + item.quantity * item.price;
      }, 0);
  
      await cart.save();
  
      console.log("Added to cart");
      res.redirect("/shop");
      
    } catch (error) {
      console.log("Adding to cart error found", error);
      res.status(500).send("Server error");
    }
  };
  


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
        const quantities = req.body.quantity;
        
        if (userId) {
          const userData = await User.findById(userId);
          const addresses = await Address.find({ user: req.session.user }).exec(); 
    // console.log("userData:",userData);
    // console.log("addresses:",addresses);
    let cart = await Cart.findOne({ user: userId }).populate('products.product').exec();
    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    if (quantities && quantities.length === cart.products.length) {
      cart.products.forEach((item, index) => {
        item.quantity = quantities[index]; // Update the quantity for each product
      });
    } else {
      return res.status(400).send("Mismatch between cart products and provided quantities");
    }

    for (let i = 0; i < cart.products.length; i++) {
      const productId = cart.products[i].product._id; // Product ID from the cart
      const orderedQuantity = cart.products[i].quantity;
      
      // Find the product and update stock
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).send(`Product with ID ${productId} not found`);
      }
      
      if (product.stock < orderedQuantity) {
        return res.status(400).send(`Insufficient stock for product with ID ${productId}`);
      }
      
      //^ Update product stock
      product.stock -= orderedQuantity;
      await product.save();
    }

    cart.totalPrice = cart.products.reduce((acc, item) => {
      return acc + (item.quantity * item.price);
    }, 0);

    await cart.save();
    
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
      req.session.addressId = req.query.addressId;
      const addressId =  req.session.addressId
      console.log(addressId);     
  
      if (userId) {
        if(addressId){
          return res.render("selectPayment");
        }else{
          return res.render("/selectAddress",{message:'please select an Address..'})
        }
       
      } else {
       return res.redirect("/pageerror")
      }
    } catch (error) {
      console.log("profile page not found", error);
      res.status(500).send("server error");
    }
  
  }



  const confirmOrder = async (req, res) => {
    try {
      const userId = req.session.user; 
      const addressId = req.session.addressId; 
  
      // Fetch the user's address details
      const userAddress = await Address.findOne({ user: userId, "address._id": addressId }, { "address.$": 1 });
  
      if (!userAddress) {
        return res.status(404).send('Address not found');
      }
  
      const address = userAddress.address[0]; // Since the address is an array, extract the first element
  
      // Fetch the user's cart
      const cart = await Cart.findOne({ user: userId }).populate('products.product'); // Populate the product details
  
      if (!cart || cart.products.length === 0) {
        return res.status(400).send('Cart is empty');
      }
  
      // Prepare the products array for the order
      const orderProducts = cart.products.map(cartItem => ({
        productId: cartItem.product._id,
        name: cartItem.product.productName, // Assuming product has a 'name' field
        quantity: cartItem.quantity,
        price: cartItem.price,
        // stock: cartItem.product.stock
        productImage : cartItem.product.productImage,
        description :cartItem.product.description,
        brand:cartItem.product.brand,
        color:cartItem.product.color,
        size:cartItem.product.size,
      }));
  
      // Prepare order details
      const order = new Order({
        userId: userId,
        payment: 'COD' ,
        address: {
          username: address.name,
          mobile: address.phone,
          city: address.city,
          pincode: address.postalCode,
          state: address.state,
          address: address.address,
        },
        products: orderProducts, // Add the products from the cart
        totalAmount: cart.totalPrice, // Use the total price from the cart
        status: 'Pending', // Initial order status
      });
  
      await order.save();
  
      // Update product quantities
      await Promise.all(orderProducts.map(async (product) => {
        const updatedProduct = await Product.findByIdAndUpdate(product.productId, {
          $inc: { quantity: -product.quantity }
        }, { new: true });
        if (!updatedProduct) {
          throw new Error(`Failed to update product quantity for product ${product.productId}`);
        }
      }));
  
      await Cart.findOneAndDelete({ user: userId });
  res.render("/selectPayment")
      res.status(200).send({ message: 'Order confirmed successfully', order });
    } catch (error) {
      console.error('Error confirming order:', error);
      res.status(500).send('Internal Server Error');
    }
  };


  const loadOrderDetails = async (req,res)=>{
    try {
      const userId = req.session.user;
      const orderId = req.query.orderId;
    console.log(`product ID: ${orderId}`);

    if (userId) {
      const orders = await Order.findOne({ _id:orderId });
      const product = orders.products[0];
      console.log("orders:",orders);
      console.log('product',product);
      
      return res.render("orderDetails",{order:orders,product:product});

    } else {
     return res.redirect("/pageerror")
    }
  } catch (error) {
    console.log("profile page not found", error);
    res.status(500).send("server error");
  }
  }




  const cancelOrder = async (req, res) => {
    try {
      const userId = req.session.user;
      const orderId = req.query.orderId; 
  
      if (!orderId) {
        return res.status(400).send('Order ID is required');
      }
  
      const order = await Order.findByIdAndUpdate(orderId, {
        $set: { status: 'Cancelled' }
      }, { new: true });
  
      if (!order) {
        return res.status(404).send('Order not found');
      }
  
      // Update product quantities (reverse the update made during order confirmation)
      await Promise.all(order.products.map(async (product) => {
        const updatedProduct = await Product.findByIdAndUpdate(product.productId, {
          $inc: { quantity: product.quantity }
        }, { new: true });
        if (!updatedProduct) {
          throw new Error(`Failed to update product quantity for product ${product.productId}`);
        }
      }));
  
      return res.render("orderDetails",{message:'Order Cancelled Successfully'});
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).send('Internal Server Error');
    }
  };

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
    confirmOrder,
    loadOrderDetails,
    cancelOrder,
}
