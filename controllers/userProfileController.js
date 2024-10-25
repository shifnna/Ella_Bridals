const User = require("../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const Product = require("../models/productSchema");
const Address = require("../models/addressSchema");
const Cart = require('../models/CartSchema');
const Order = require("../models/orderSchema")
const Razorpay = require("razorpay")
const Coupon = require("../models/couponSchema");
const { session } = require("passport");
const Category = require("../models/categorySchema");
const Transaction = require("../models/transactionSchema")

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Replace with your Razorpay Key ID
    key_secret: process.env.RAZORPAY_KEY_SECRET // Replace with your Razorpay Key Secret
});



const loadUserProfile = async (req, res) => {
  try {
      const userId = req.session.user;
      const userData = await User.findById(userId);
      const addresses = await Address.find({ user: req.session.user }).exec(); 
      const message = req.query.message || '';
      return res.render("profile", { user: userData, addresses: addresses ,message});
    
  } catch (error) {
    console.log("profile page not found", error);
    res.status(500).send("server error");
    return res.redirect("/pageerror")
  }
}


const editProfilePage = async (req,res)=>{
    try {
          const userId = req.session.user;
          const profile = await User.findOne({_id:userId})
          res.render("edit-profile", { data: profile });
    } catch (error) {
      console.log("profile edit page not found", error);
      res.status(500).send("server error");
      return res.redirect("/pageerror")
    }
  }



const editProfile = async (req,res)=>{
    try {
       const id = req.params.id
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
      const userId = req.session.user;
        const usermodel = await User.findOne({_id:userId})
        res.render("add-address", { data: usermodel });
  } catch (error) {
      console.log("profile edit page not found", error);
    res.status(500).send("server error");
  }
  }



  const addAddress = async (req, res) => {
    try {
        const userId = req.params.id; 
        const { name, phone, address, city, state, postalCode, country } = req.body;
        const users = await User.findById(req.session.user);

        const existingAddress = await Address.findOne({ user: userId });
  
        if (existingAddress) {
          // If an address document exists, push the new address to the array
          existingAddress.address.push({
            name,
            phone,
            address,
            city,
            state,
            postalCode,
            country
          });
          await existingAddress.save();
        } else {
          // If no address document exists, create a new one
          const newAddress = new Address({
            user: userId,
            address: [{
              name,
              phone,
              address,
              city,
              state,
              postalCode,
              country
            }]
          });
          await newAddress.save();
          users.addresses.push(newAddress);
          users.save();
        }
      
        return res.redirect("/userProfile");
      
    } catch (error) {
      console.error("Error adding address:", error);
      res.status(500).json({
        message: 'Error adding address',
        error: error.message
      });
    }
  };
  



  const editAddressPage = async (req, res) => {
    try {
      const addressId = req.query.addressId;
      const userId = req.session.user;        
  
        const address = await Address.findOne({ user: userId });
        if (!address) {
          console.log('No address found for this user.');
          return res.redirect("/pageerror");
        }
  
        const targetAddress = address.address.find(addr => addr._id.toString() === addressId);
        if (!targetAddress) {
          console.log('Address not found for ID:', addressId);
          return res.redirect("/pageerror");
        }
  
        console.log("target address:", targetAddress);
        return res.render("edit-address", { address: targetAddress });
      
    } catch (error) {
      console.error("Error fetching address for edit:", error.message);
      return res.redirect("/pageerror");
    }
  };
  



  const editAddress = async (req, res) => {
    try {
      const addressId = req.params.id;
      const user = await User.findById(req.session.user);

      console.log('addressId: ',addressId);
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
      { user:user},
      { $set: { 
        "address.$.name": editedAddress.name, 
        "address.$.phone": editedAddress.phone, 
        "address.$.address": editedAddress.address, 
        "address.$.city": editedAddress.city, 
        "address.$.state": editedAddress.state, 
        "address.$.postalCode": editedAddress.postalCode, 
        "address.$.country": editedAddress.country 
      } },{ new: true });

      if(result){
        res.redirect("/userProfile");
      }else{
        return res.redirect("/pageerror");
      }

    } catch (error) {
      console.error(error.message);
      return res.redirect("/pageerror");
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
      const userId = req.userId;
      const orders = await Order.find({ userId: userId }).sort({orderDate:-1})
      console.log("orders:",orders);
      return res.render("orders",{orders:orders});

  } catch (error) {
    console.log("profile page not found", error);
    res.redirect("/pageerror")
  }
  }



  const loadOrderDetails = async (req, res) => {
    try {
      const orderId = req.query.orderId;
    
        const order = await Order.findOne({ _id: orderId }).sort({ orderDate: -1 });
               
        return res.render("orderDetails", { order: order });
      
    } catch (error) {
      console.log("Error loading order details:", error);
      res.status(500).send("Server error");
      return res.redirect("/pageerror");
    }
  };




  
 const cartPage = async (req,res)=>{
    try {
      const userId = req.session.user;
        const user = await User.findById(userId);        
        
        const cart = await Cart.findOne({ user: userId }).populate('products.product');  // Populates product details in cart
        const couponCode = req.session.couponCode || ''; 
        const coupons = await Coupon.find();
        const errorMessage = req.session.errorMessage || null;
        req.session.errorMessage = null; // Clear the message after using it

        res.render("cart", {
            availableCoupons: coupons,
            user: user,
            cart: cart ? cart.products : [],
            totalPrice: cart ? cart.totalPrice : 0,
            couponCode: couponCode || '',
            errorMessage: errorMessage,
            discountValue: req.session.discount || 0,
        });
     
    } catch (error) {
      console.error(error);
      console.log('hy4');
      return res.redirect("/pageerror")

    }
  }


  
  const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.params.id;
        const productId2 = req.params.id2;
        const quantity = parseInt(req.body.quantity, 10) || 1; // Ensure quantity is a number and defaults to 1 if not provided

        const user = await User.findById(userId)
        
        if (productId2 == 11) {
          user.wishlist.pull(productId);
          await user.save(); 
      }
        const product = await Product.findById(productId);
        if (!product) {
          return res.redirect(`/shop?message=product not found`)
        }
        if (product.isBlocked || product.quantity <= 0) {
            return res.redirect(`/shop?message=product is unavailable`)
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({
                user: userId,
                products: [],
                totalPrice: 0,
                Amount: 0,
            });
        }

        const existingProductIndex = cart.products.findIndex(item => item.product.toString() === productId);

        if (existingProductIndex > -1) {
            // Update quantity of existing product
            const existingProduct = cart.products[existingProductIndex];
            existingProduct.quantity += quantity;
            if (existingProduct.quantity > product.stock) {
                return res.status(400).send('Insufficient stock');
            }
        } else {
            // Add new product to cart
            if (quantity > product.stock) {
                return res.status(400).send('Insufficient stock');
            }

            cart.products.push({
                product: productId,
                quantity: quantity,
                name: product.productName,
                productImage: product.productImage[0],
                price: product.salePrice || product.regularPrice,
                stock: product.quantity,
                brand: product.brand,
                size: product.size,
                color: product.color,
                category: product.category.name,
                offerPrice: product.offerPrice || 0,
            });
        }

        
        // Calculate total price and amount
        cart.totalPrice = cart.products.reduce((total, item) => {
            const priceToUse = item.offerPrice > 0 ? item.offerPrice : item.price;
            console.log(`Calculating: ${item.name}, Quantity: ${item.quantity}, Price: ${priceToUse}`);
            return total + (item.quantity * priceToUse);
        }, 0);

        cart.Amount = cart.products.reduce((total, item) => {
            return total + (item.quantity * item.price);
        }, 0);

        console.log('Total Price:', cart.totalPrice);
        console.log('Amount:', cart.Amount);

        await cart.save();

        res.redirect("/cart");

    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).send("Server error");
        return res.redirect("/pageerror")

    }
};


const updateCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const cartItemId = req.params.id; 
        const { quantity } = req.body;

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
           res.status(404).json({ error: 'Cart not found' });
           return res.redirect("/pageerror")
        }

        const existingProductIndex = cart.products.findIndex(item => item._id.toString() === cartItemId);
        if (existingProductIndex > -1) {
            const existingProduct = cart.products[existingProductIndex];
            existingProduct.quantity = quantity;

            // Calculate total price after updating quantity
            cart.totalPrice = cart.products.reduce((total, item) => {
                const priceToUse = item.offerPrice > 0 ? item.offerPrice : item.price;
                return total + (item.quantity * priceToUse);
            }, 0);

            cart.Amount = cart.products.reduce((total, item) => {
                return total + (item.quantity * item.price);
            }, 0);

            await cart.save();
            return res.json({ success: true, totalPrice: cart.totalPrice, Amount: cart.Amount });
        } else {
          return res.redirect(`/cart`)
        }
    } catch (error) {
        console.error("Error updating cart:", error);
        return res.status(500).send("Server error");
        return res.redirect("/pageerror")

    }
};




  const removeFromCart = async (req, res) => {
    try {
      const userId = req.session.user;
      const productId = req.query.productId;
  
        let cart = await Cart.findOneAndUpdate(
          { user: userId },
          { $pull: { products: { _id: productId } } },
          { new: true }
        );
  
        if (!cart) {
          return res.redirect("/pageerror")
        }
  
        console.log("Product removed from cart");
        res.redirect("/cart");
      
    } catch (error) {
      console.log("Removing from cart error found", error);
      res.status(500).send("Server error");
      return res.redirect("/pageerror")

    }
  };



  const selectAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        
        const cartItems = req.query;

        if(!cartItems){
          return res.redirect("/cart")
        }
        const quantities = {};
        req.session.updatedTotalAmount = req.query.updatedTotalAmount;

        Object.keys(cartItems).forEach(key => {
            if (key.startsWith('quantities[')) {
                const cartItemId = key.replace('quantities[', '').replace(']', '');
                quantities[cartItemId] = cartItems[key];
            }
        });

        if (userId) {
            const userData = await User.findById(userId);
            const addresses = await Address.find({ user: userId }).exec();
            let cart = await Cart.findOne({ user: userId }).populate('products.product').exec();
            if (!cart) {
                return res.redirect("/cart");
            }

            // Check and update product stock
            for (let i = 0; i < cart.products.length; i++) {
                const productId = cart.products[i].product._id;
                const orderedQuantity = cart.products[i].quantity;

                const product = await Product.findById(productId);
                if (!product) {
                    return res.redirect("/cart");
                }

                if (product.stock < orderedQuantity) {
                    return res.status(400).send(`Insufficient stock for product with ID ${productId}`);
                }

                product.stock -= orderedQuantity;
                await product.save();
            }

            await cart.save();

            // Render selectAddress page
            return res.render("selectAddress", {
                user: userData,
                addresses: addresses,
                message: req.query.message || ''
            });
        } else {
            return res.redirect("/login");
        }
    } catch (error) {
        console.log("Error in selectAddress", error);
        res.status(500).send("server error");
        return res.redirect("/pageerror");
    }
};



  const selectPayment = async (req, res) => {
    try {
        const userId = req.session.user;
        req.session.addressId = req.query.addressId;
        const addressId = req.session.addressId  || req.query.addressId;
        
            const user = await User.findById(userId);
            const cart = await Cart.findOne({ user: userId }).populate('products.product');
            if (!cart) {
              return res.redirect("/cart");
          }
            let dis = parseFloat(req.session.discount) || 0; 
            let totalPrice =  0; 
            let offerPrice =  0;
            let totalOfferPrice = 0;

            //     // Debugging Logs
            // console.log('User ID:', userId);
            // console.log('Cart:', cart);
            // console.log('Discount:', dis);
            // console.log('Total Price:', totalPrice);
            // console.log('Offer Price:', offerPrice);
            // console.log(cart.products[0].price);
            // console.log(cart.products[0].quantity);
            
            cart.products.forEach(item => {
              let price = parseFloat(item.price) || 0;
              let quantity = item.quantity || 1;
              let offerPrice = parseFloat(item.offerPrice) || 0;

              // Calculate total based on whether an offer price exists
              const effectivePrice = offerPrice > 0 ? offerPrice : price;
              totalPrice += effectivePrice * quantity;
              totalOfferPrice += offerPrice > 0 ? offerPrice * quantity : 0;
          }); 

          totalPrice = req.session.updatedTotalAmount

            if (addressId) {
              return res.render("selectPayment", { 
                user: user, 
                cart: cart.products, 
                totalPrice: totalPrice ,  
                dis,
                offerPrice: totalOfferPrice , // Send total offer price
                message: req.query.message || 'none'
            });  

          } else {
            return res.redirect("/selectAddress?message=Please select an address.");
          }
        
    } catch (error) {
        console.log("profile page not found", error);
        res.status(500).send("server error");
        return res.redirect("/pageerror")

    }
};


const confirmOrder2 = async (req,res)=>{
  try {
    const orderId = req.query.orderId;   
    const order = await Order.findById(orderId)

  return res.render('razorpayPage', {
    key_id: process.env.RAZORPAY_KEY_ID,
    order_id: order.razorpayOrderId,
    amount: order.totalAmount,
    user: req.session.user,
});

  } catch (error) {
    console.log('error retry payment',error);
    return res.redirect("/pageerror")
    
  }
}



const confirmOrder = async (req, res) => {
  try {
      const paymentMethod = req.body.paymentMethod;
      const userId = req.session.user; 
      const addressId = req.session.addressId;
      const subtotal = req.query.subtotal;

      let user = await User.findById(userId);

      const userAddress = await Address.findOne({ user: userId, "address._id": addressId }, { "address.$": 1 });

      if (!userAddress) {
          return res.redirect("/pageerror");
      }

      if (paymentMethod === 'cashOnDelivery' && subtotal > 1000) {
          return res.redirect(`/selectPayment?addressId=${addressId}&totalPrice=${subtotal}&message=Cash On Delivery is not available for the order above 1000`);
      }

      const address = userAddress.address[0]; // Extract address

      const cart = await Cart.findOne({ user: userId }).populate('products.product');

      if (!cart || cart.products.length === 0) {
          return res.status(400).send('Cart is empty');
      }

      // Filter products to include only those not cancelled
      const filteredProducts = cart.products.filter(cartItem => cartItem.product.status !== 'Cancelled');

      // Prepare order details
      const orderProducts = filteredProducts.map(cartItem => ({
          productId: cartItem.product._id,
          name: cartItem.product.productName,
          quantity: cartItem.quantity,
          price: cartItem.offerPrice !== 0 ? cartItem.offerPrice : cartItem.price,
          productImage: cartItem.product.productImage,
          description: cartItem.product.description,
          brand: cartItem.product.brand,
          color: cartItem.product.color,
          size: cartItem.product.size,
          category: cartItem.category,
          couponDiscount: parseFloat(req.session.discount) || 0,
          offerPrice: parseFloat(req.session.offerPrice) || 0,
          status:'OrderConfirmed'
      }));

      const offerDiscount = cart.Amount - cart.totalPrice;

      // Prepare the order
      const order = new Order({
          userId: userId,
          payment: paymentMethod,
          address: {
              username: address.name,
              mobile: address.phone,
              city: address.city,
              pincode: address.postalCode,
              state: address.state,
              address: address.address,
          },
          products: orderProducts,
          totalAmount: req.session.updatedTotalAmount,
          status: 'OrderConfirmed',
          couponDiscount: parseFloat(req.session.discount) || 0,
          offerDiscount: offerDiscount,
      });

      await User.findByIdAndUpdate(userId, {
          $addToSet: { orderHistory: order._id } 
      });

      
      //^ Handle Wallet Payment
      if (paymentMethod === 'wallet') {
          if (user.wallet < req.session.updatedTotalAmount) {
              return res.redirect(`/selectPayment?addressId=${addressId}&message=Insufficient wallet balance&`);
          }

          const transaction = new Transaction({
            description: `${req.session.updatedTotalAmount} withdrawed for Order ORD-${order._id.toString().slice(-8).toUpperCase()}`,
            amount: req.session.updatedTotalAmount,
            userId,
            orderId:order._id,
        });
        const savedTransaction = await transaction.save();
        user.transactions.push(savedTransaction._id);

            user.wallet -= req.session.updatedTotalAmount; 
            await user.save(); 
            
          
          await Cart.findOneAndDelete({ user: userId }); 

          if (req.session.couponCode) {
              const coupon = await Coupon.findOne({ couponCode: req.session.couponCode });
              if (coupon && !coupon.usedBy.includes(userId)) {
                  coupon.usedBy.push(userId);
                  await coupon.save();
              }
          }

          // Update product quantities
          await Promise.all(orderProducts.map(async (product) => {
              try {
                  const updatedProduct = await Product.findByIdAndUpdate(product.productId, {
                      $inc: { quantity: -product.quantity }
                  }, { new: true });

                  if (!updatedProduct) {
                      throw new Error(`Product ${product.productId} not found or failed to update`);
                  }
              } catch (err) {
                  console.error(`Error updating product ${product.productId}:`, err);
              }
          }));

          req.session.discount = 0; 
          order.totalAmount = req.session.updatedTotalAmount;
          await order.save(); 
          return res.redirect("/shop?orderSuccess=true");
      }

      //^ Razorpay payment handling
      if (paymentMethod === 'razorpay') {
          try {
              const razorpayOrder = await razorpay.orders.create({
                  amount: Math.round(req.session.updatedTotalAmount * 100), // Convert to paisa
                  currency: 'INR',
                  receipt: order._id.toString(),
              });

              console.log('Razorpay Order Response:', razorpayOrder); // Log the response

              if (!razorpayOrder || !razorpayOrder.id) {
                  throw new Error('Invalid Razorpay order response');
              }

              order.products.forEach(product => {
                product.status = 'Pending'; // Set the desired new status
              });

              order.razorpayOrderId = razorpayOrder.id;
              order.status = 'Pending';
              order.totalAmount = req.session.updatedTotalAmount;
              await order.save();
              cart.totalPrice = req.session.updatedTotalAmount;
              await cart.save();

              await Cart.findOneAndDelete({ user: userId });

              return res.render('razorpayPage', {
                  key_id: process.env.RAZORPAY_KEY_ID,
                  order_id: razorpayOrder.id,
                  amount: order.totalAmount,
                  user: req.session.user,
              });
          } catch (razorpayError) {
              console.error('Razorpay API Error:', razorpayError);
              return res.status(500).send('Failed to create Razorpay order');
          }
      }

      await Cart.findOneAndDelete({ user: userId }); // Clear cart

      if (req.session.couponCode) {
          const coupon = await Coupon.findOne({ couponCode: req.session.couponCode });
          if (coupon && !coupon.usedBy.includes(userId)) {
              coupon.usedBy.push(userId);
              await coupon.save();
          }
      }

      // Update product quantities
      await Promise.all(orderProducts.map(async (product) => {
          try {
              const updatedProduct = await Product.findByIdAndUpdate(product.productId, {
                  $inc: { quantity: -product.quantity }
              }, { new: true });

              if (!updatedProduct) {
                  throw new Error(`Product ${product.productId} not found or failed to update`);
              }
          } catch (err) {
              console.error(`Error updating product ${product.productId}:`, err);
          }
      }));

      req.session.discount = 0; // Reset discount session
      await order.save(); // Save the order

      return res.redirect("/shop?orderSuccess=true");

  } catch (error) {
      console.error('Error confirming order:', error);
      res.status(500).send('Internal Server Error');
  }
};




const verifyPayment = async (req, res) => {

  const userId = req.session.user;

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
     
      const crypto = require('crypto');
      const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      shasum.update(razorpay_order_id + '|' + razorpay_payment_id);
      const expectedSignature = shasum.digest('hex');

      if (expectedSignature === razorpay_signature) {

       let order = await Order.findOne({ userId: userId });

       const orderProducts = order.products.map(product => ({
        productId: product.productId,
        name: product.name, // Assuming product has a 'name' field
        quantity: product.quantity,
        price: product.price,        
        productImage: product.productImage[0],
        description: product.description,
        brand: product.brand,
        color: product.color,
        size: product.size,
      }));


       //update quantity
       await Promise.all(orderProducts.map(async (product) => {
        try {
          // console.log(`Attempting to update product: ${product.productId} - reducing quantity by: ${product.quantity}`);
          // console.log('Updating product quantity for:', product.productId, 'with quantity:', -product.quantity);

          const updatedProduct = await Product.findByIdAndUpdate(product.productId, {
            $inc: { quantity: -product.quantity }
          }, { new: true });
      
          req.session.discount = 0;

          if (!updatedProduct) {
            throw new Error(`Product ${product.productId} not found or failed to update`);
          }
      
        } catch (err) {
          console.error(`Error updating product ${product.productId}:`, err);
        }
      }));

      // console.log('razorpay id',razorpay_order_id);
      
      order = await Order.findOne({ userId: userId, razorpayOrderId: razorpay_order_id });
      order.products.forEach(product => {
        product.status = 'OrderConfirmed'; // Set the desired new status
      });
      
      order.status = 'OrderConfirmed';
      order.save();

          await Cart.findOneAndDelete({ user: userId }); 
       
            return res.json({ success: true,orderId: order._id  }); // Return success JSON response
          
      } else {  
          console.error('Payment verification failed: Invalid signature');
          return res.status(400).send({ success: false, message: 'Payment verification failed' });
      }
  } catch (error) {
      console.error('Error during payment verification:', error);
      return res.status(500).send('Internal Server Error');
  }
};



  const cancelOrder = async (req, res) => {
    try {
        console.log('Start cancelling order');

        const userId = req.session.user;
        const orderId = req.query.orderId; 
        const productId = req.query.productId; 
        let user = await User.findById(userId);

        if (!user || user.isBlocked) {
            return res.redirect("/login");
        }

        if (!orderId || !productId) {
            console.log('Order ID and Product ID are required');
            return res.redirect("pageerror");
        }

        const order = await Order.findById(orderId);
        if (!order) {
            console.log('Order not found');
            return res.redirect('/pageerror');
        }

        // console.log('Order found:', order);

        // Find the product in the order
        const productToCancel = order.products.find(product => product.productId.toString() === productId);
        if (!productToCancel) {
            console.log('Product not found in order');
            return res.redirect("/pageerror");
        }
        order.totalAmount -= productToCancel.price*productToCancel.quantity; 

        // Find the product and change its status
        const productToUpdate = order.products.find(product => product.productId.toString() === productId);
        if (productToUpdate) {
            // Check if the status field exists
            if (typeof productToUpdate.status === 'undefined') {
                productToUpdate.status = 'Cancelled';
                console.log(`Added status 'Cancelled' to productId: ${productId}`);
            } else {
                productToUpdate.status = 'Cancelled'; // Update the status if it already exists
                console.log(`Updated status to 'Cancelled' for productId: ${productId}`);
            }
            order.markModified('products');
        } else {
            console.log('No product to update found in the order');
        }

        // Check if all products are cancelled and update order status if needed
        if (order.products.every(product => product.status === 'Cancelled')) {
            order.status = 'Cancelled';
            order.totalAmount = 0; 
            console.log('All products are cancelled, updating order status to Cancelled');
        }

        await order.save();

        // Update product quantities (reverse the update made during order confirmation)
        await Product.findByIdAndUpdate(productId, {
            $inc: { quantity: productToCancel.quantity }
        }, { new: true });

        //^ Handle payment refund
        if (order.payment === 'razorpay' || order.payment === 'wallet') {
            user.wallet += productToCancel.price*productToCancel.quantity; 
            await user.save();

            const transaction = new Transaction({
                description: `Product ${productId.toString().slice(-8).toUpperCase()} from Order ${orderId.toString().slice(-8).toUpperCase()} Cancelled`,
                amount: productToCancel.price*productToCancel.quantity,
                userId,
                orderId,
            });
            const savedTransaction = await transaction.save();
            user.transactions.push(savedTransaction._id);
            await user.save();
        }

      return res.render("orderDetails", { order: order, message: 'Product Cancelled Successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).send('Internal Server Error');
    }
};




  
  const returnOrder = async (req, res) => {
    try {
      const userId = req.session.user;
      const orderId = req.query.orderId; 
      const productId = req.query.productId;
    
      if (!orderId) {
        return res.status(400).send('Order ID is required');
      }
    
      const order = await Order.findById(orderId)  
      if (!order) {
        return res.render("orderDetails", { order: order, message: 'Order not found' });
      }
    
      const productToReturn = order.products.find(product => product.productId.toString() === productId);
      if (!productToReturn) {
          console.log('Product not found in order');
          return res.redirect("/pageerror");
      }
      order.totalAmount -= productToReturn.price; 

      // Find the product and change its status
      const productToUpdate = order.products.find(product => product.productId.toString() === productId);
      if (productToUpdate) {
          // Check if the status field exists
          if (typeof productToUpdate.status === 'undefined') {
              productToUpdate.status = 'Returned';
              console.log(`Added status 'Cancelled' to productId: ${productId}`);
          } else {
              productToUpdate.status = 'Returned'; // Update the status if it already exists
              console.log(`Updated status to 'Cancelled' for productId: ${productId}`);
          }
          order.markModified('products');
      } else {
          console.log('No product to update found in the order');
      }

      // Check if all products are cancelled and update order status if needed
      if (order.products.every(product => product.status === 'Returned')) {
          order.status = 'Returned'; 
          console.log('All products are Returned, updating order status to Cancelled');
      }

      await order.save();

      // Update product quantities (reverse the update made during order confirmation)
      await Product.findByIdAndUpdate(productId, {
          $inc: { quantity: productToReturn.quantity }
      }, { new: true });


    //^ Handle Payment refund
      if (order.payment === 'razorpay' || order.payment === 'wallet') {
      const user = await User.findById(userId);
      user.wallet += order.totalAmount;
      await user.save();

      // Save transaction details
      const transaction = new Transaction({
        description:`Order ${orderId.toString().slice(-8).toUpperCase()} Returned`,
        amount : order.totalAmount,
        userId,
        orderId,
      });
      const savedTransaction = await transaction.save();

   // Push the transaction ID to the user's transactions array
      user.transactions.push(savedTransaction._id);
      await user.save();

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

      
      return res.render("orderDetails", { order: order, message: 'Return Order Successfully', });
    } catch (error) {
      console.error('Error returning order:', error);
      res.status(500).send('Internal Server Error');
      return res.redirect("/pageerror")
    }
  };



  

  const applyCoupon = async (req, res) => {
    try {
        const userId = req.session.user;
        const { couponCode , cartData} = req.body;

        let parsedCartData = cartData ? JSON.parse(cartData) : null;

        const cart = await Cart.findOne({ user: userId }).populate('products.product');

        if (parsedCartData) {
          parsedCartData.forEach(item => {
              const cartItem = cart.products.find(product => product.product._id.toString() === item.id);
              if (cartItem) {
                  cartItem.quantity = item.quantity;  
              }
          });
          await cart.save();  
      }


        const coupon = await Coupon.findOne({ couponCode });
        const coupons = await Coupon.find();


        if (!coupon) {
         return res.redirect("/cart")
        }

        
        // Check if coupon is expired
        if (new Date() > coupon.expiryDate) {
            return res.render("cart", {
              availableCoupons:coupons ,
                user: req.user,
                cart: cart.products,
                totalPrice: cart.totalPrice,
                couponCode: couponCode,
                discountValue: 0, 
                errorMessage: 'Coupon has expired' 
            });
        }

        let discountValue = 0;

        if (coupon.usedBy.includes(userId)) {
            return res.render("cart", {
              availableCoupons:coupons ,
                user: req.user,
                cart: cart.products,
                totalPrice: cart.totalPrice,
                couponCode: couponCode,
                discountValue: discountValue || 0, 
                errorMessage: 'You have already used this coupon' 
            });
        }


        if (coupon.discountType === 'percentage') {
            discountValue = (cart.totalPrice * coupon.discountValue) / 100;
        } else if (coupon.discountType === 'amount') {
            discountValue = coupon.discountValue;
        }
        // Ensure discount doesn't exceed cart total
        discountValue = Math.min(discountValue, cart.totalPrice);


        if (coupon && !req.session.applied) {
        //           // Calculate discount
        // if (coupon.discountType === 'percentage') {
        //     discount = (cart.totalPrice * coupon.discountValue) / 100;
        // } else if (coupon.discountType === 'amount') {
        //     discount = coupon.discountValue;
        // }

       req.session.couponCode = couponCode;
       req.session.discount = discountValue;
       cart.totalPrice -= discountValue;
       req.session.applied = true;

        await cart.save();

      }


      const totalPrice = parseFloat(cart.totalPrice);
      discountValue = parseFloat(discountValue);
      console.log("Updated Total Price:", cart.totalPrice);
      console.log("Applied Discount Value:", discountValue);
      
      return res.redirect("/cart");

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
        return res.redirect("/pageerror")

    }
};




const orderSuccess = async (req,res)=>{
  return res.render("orderSuccess");
}


const orderFailed = async (req,res)=>{
  const orderId = req.query.orderId;
  console.log('orderid in failed page:',orderId);
  return res.render("orderFailed",{orderId:orderId})
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
    confirmOrder,
    loadOrderDetails,
    cancelOrder,
    returnOrder,
    verifyPayment,
    applyCoupon,
    updateCart,
    confirmOrder2,
    orderSuccess,
    orderFailed,
}
