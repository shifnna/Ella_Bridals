const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Brand = require("../models/brandSchema");
const fs = require("fs");
const path = require("path");
const Order = require("../models/orderSchema");
const User = require("../models/userSchema")
const Coupon = require("../models/couponSchema");



const loadOrders = async (req, res) => {
  try {
    if (req.session.admin) {
      let search = "";
      if (req.query.search) {
        search = req.query.search;
      }

      let page = 1;
      if (req.query.page) {
        page = parseInt(req.query.page);
      }
      const limit = 10;

      const orderData = await Order.find({
        $or: [
          { "address.username": { $regex: ".*" + search + ".*", $options: "i" } },
          { status: { $regex: ".*" + search + ".*", $options: "i" } }
        ]
      })
        .sort({ orderDate: -1 }) 
        .skip((page - 1) * limit)
        .limit(limit);

      const count = await Order.find({
        $or: [
          { "address.username": { $regex: ".*" + search + ".*", $options: "i" } },
          { status: { $regex: ".*" + search + ".*", $options: "i" } }
        ]
      }).countDocuments();

      const totalPages = Math.ceil(count / limit);

      res.render("orderManagement", {
        orders: orderData,
        currentPage: page,
        totalPages: totalPages,
        totalCategories: count,
        search: search,
      });
    } else {
      res.redirect("/pageerror");
    }

  } catch (error) {
    console.error('Error loading orders:', error);
    res.status(500).send('Internal Server Error');
  }
};





const loadOrderDetails = async (req, res) => {
  try {
    if(req.session.admin){
      let search = req.query.search || ""; 
      let page = parseInt(req.query.page) || 1; 
      const limit = 10; 
  
      const ordersList = await Order.find({
        $or: [
          { 'products.productName': { $regex: ".*" + search + ".*" } }, 
          { status:  { $regex: ".*" + search + ".*" }} 
        ]
      })
        .sort({ orderDate: -1 }) 
        .skip((page - 1) * limit) 
        .limit(limit); 
  
     
      const count = await Order.find({
        $or: [
          { 'products.productName': { $regex: ".*" + search + ".*" } },
          { status: { $regex: ".*" + search + ".*" } }
        ]
      }).countDocuments();
  
      const totalPages = Math.ceil(count / limit); 
  
      const orderId = req.query.orderId;
      let order = null;
      if (orderId) {
        order = await Order.findOne({ _id: orderId }); 
      }
      const userId = order.userId;
      const userData = await User.findOne({_id:userId})
  
      res.render("viewOrderDetails", {
        order: ordersList,
        currentPage: page, 
        totalPages: totalPages, 
        totalOrders: count, 
        search: search,
        orderId: orderId, 
        order: order,
        user : userData,
      });      
    }else{
      res.redirect("/pageerror")
    }
    

  } catch (error) {
    console.error('Error loading order details:', error);
    res.status(500).send('Internal Server Error');
  }
};



const changeStatus = async (req, res) => {
  if (req.session.admin) {
    const status = req.body.status;
    const orderId = req.query.orderId;

    if (orderId) {
    const order = await Order.findOne({ _id: orderId })

      if (order) {
        order.status = status.charAt(0).toUpperCase() + status.slice(1);

        // Update each product's status
        order.products.forEach(product => {
          product.status = order.status; 
        });

        await order.save(); // Save the order with updated product statuses

        console.log('Updated order:', order); // Verify updated order
      }
      
      const userId = order.userId;
      const userData = await User.findOne({ _id: userId });

      res.render("viewOrderDetails", {
        order: order,
        orderId: orderId,
        user: userData,
      });
    }
  } else {
    res.redirect("/pageerror");
  }
};



  module.exports = {
    loadOrders,
    loadOrderDetails,
    changeStatus,
  }