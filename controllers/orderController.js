const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Brand = require("../models/brandSchema");
const fs = require("fs");
const path = require("path");
const Order = require("../models/orderSchema");
const User = require("../models/userSchema")


const loadOrders = async (req, res) => {
  try {
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
      .sort({ "address.username": -1 })
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
  } catch (error) {
    console.error('Error loading orders:', error);
    res.status(500).send('Internal Server Error');
  }
};




const loadOrderDetails = async (req, res) => {
  try {
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

  } catch (error) {
    console.error('Error loading order details:', error);
    res.status(500).send('Internal Server Error');
  }
};



const changeStatus = async (req,res)=>{

  const status = req.body.status;
  const orderId = req.query.orderId;
  let order = null;
  if (orderId) {
    order = await Order.findOne({ _id: orderId }); 
    if(order){
      order.status = status.charAt(0).toUpperCase() + status.slice(1); // Convert the status to title case
      await order.save();
    }
  }
  const userId = order.userId;
    const userData = await User.findOne({_id:userId})

  res.render("viewOrderDetails", {
    order: order,
    orderId: orderId,
    user:userData, 
  });
  
}

  module.exports = {
    loadOrders,
    loadOrderDetails,
    changeStatus,
  }