const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Brand = require("../models/brandSchema");
const fs = require("fs");
const path = require("path");
const Order = require("../models/orderSchema");


const loadOrders = async (req, res) => {
  try {
    let search = "";
    if(req.query.search){
        search=req.query.search;
    }
    
    let page = 1
    if(req.query.page){
        page=req.query.page;
    }
    const limit = 10;

    const ordersData = await Order.find(
        // $or:[
        //   { orderDate: new Date(searchs) },
        //   { address: { $elemMatch: { username:{$regex:".*"+search+".*"}}}}
        // ],

    ).sort({ orderDate: 1 }).limit(limit*1).skip((page-1)*limit).exec()//chain of promise ne combine cheyyan

    const searchs = '2024-09-15';
    const count = await Order.find({
      $or:[
        { orderDate: new Date(searchs) },
          { address: { $elemMatch: { username:{$regex:".*"+search+".*"}}}}
      ],
  }).countDocuments();
  
  const totalPages = Math.ceil(count / limit);

  res.render("orderManagement", { orders: ordersData, totalPages: totalPages, currentpage: page, search: search });

  } catch (error) {
      console.error('Error loading orders:', error);
      res.status(500).send('Internal Server Error');
  }
};



const loadOrderDetails = async (req,res)=>{
  try {
    const orderId = req.query.orderId;
    
    const order = await Order.findOne({_id:orderId});
    console.log(order);

    res.render("viewOrderDetails",{order:order})
    
  } catch (error) {
    console.error('Error loading order details:', error);
    res.status(500).send('Internal Server Error');
  }
}

  module.exports = {
    loadOrders,
    loadOrderDetails,
  }