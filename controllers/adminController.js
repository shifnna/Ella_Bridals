const User = require("../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Order = require("../models/orderSchema");
const XLSX = require('exceljs');
const { jsPDF } = require('jspdf'); // Importing correctly based on the version
require("jspdf-autotable"); // Import autotable plugin
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema")



const pageerror = async (req,res)=>{
    res.render("page_404");
}


const loadLogin =  (req,res)=>{
    
    if(req.session.admin){
        return res.redirect("/admin/dashboard")

    }else{
        res.render("loginPage",{message:null})
    }
    
}




const login = async (req,res)=>{
    try {
        if(!req.session.admin){
            const {email,password} = req.body;

            const admins =await User.findOne({email,isAdmin:true});
    
            if (!admins) {
                return res.render("loginPage", { message: "Incorrect email or password" });
            }
    
            const passwordMatch = await bcrypt.compare(password, admins.password);
    
            if (!passwordMatch) {
                return res.render("loginPage", { message: "Incorrect email or password" });
            }
    
            req.session.admin = true;
        }        

 //^ Step 1: Aggregate orders to find total quantity sold for each product
 const salesData = await Order.aggregate([
    { $unwind: "$products" }, 
    {
        $group: {
            _id: "$products.productId", 
            totalSold: { $sum: "$products.quantity" } // Sum the quantities
        }
    },
    { $sort: { totalSold: -1 } }, 
    { $limit: 10 } 
]);

// Step 2: Retrieve product details based on the product IDs
const productIds = salesData.map(item => item._id);
const products = await Product.find({ _id: { $in: productIds } });

// Step 3: Combine the sales data with product details
const topSellingProducts = salesData.map(sale => {
    const product = products.find(p => p._id.equals(sale._id));
    return {
        productName: product ? product.productName : 'Unknown',
        totalSold: sale.totalSold,
    };
});


//^ Step 1: Aggregate for Categories
const categorySalesData = await Order.aggregate([
    { $unwind: "$products" },
    {
        $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productDetails"
        }
    },
    { $unwind: "$productDetails" },
    {
        $group: {
            _id: "$productDetails.category",
            totalSold: { $sum: "$products.quantity" }
        }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
]);

const categoryIds = categorySalesData.map(item => item._id);
const categories = await Category.find({ _id: { $in: categoryIds } });

const topSellingCategories = categorySalesData.map(sale => {
    const category = categories.find(c => c._id.equals(sale._id));
    return {
        categoryName: category ? category.name : 'Unknown',
        totalSold: sale.totalSold,
    };
});

//^ Get top-selling brands
const brandSalesData = await Order.aggregate([
    { $unwind: "$products" },
    {
        $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productDetails"
        }
    },
    { $unwind: "$productDetails" },
    {
        $group: {
            _id: "$productDetails.brand",
            totalSold: { $sum: "$products.quantity" }
        }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
]);

const topSellingBrands = brandSalesData.map(sale => ({
    brandName: sale._id || 'Unknown',
    totalSold: sale.totalSold,
}));


        const orders = [];
        const grandTotal = 0;
        const totalDiscount = 0;
        const offerDiscount = 0;
        const chartData = [];
        
        return res.render("dashboard", { orders, grandTotal, totalDiscount, offerDiscount ,topSellingProducts,topSellingCategories,topSellingBrands,chartData});

    } catch (error) {
        console.log("login error",error);
        return res.render("page_404")
        
    }
}



const logout= async (req,res)=>{
    req.session.destroy((err) => {
        req.session.admin=false;
        if (err) {
            console.log("Error destroying session:", err);
            return res.redirect("admin/pageerror"); // Redirect to error page only on session destruction failure
        }
        res.clearCookie('connect.sid', { path: '/admin/login' }); // Clear the session cookie
        return res.redirect("/admin/login"); // Redirect to the login page after successful logout
    });
}



const generateReport = async (req, res) => {
    const formatDateString = (dateString) => {
        // Check if the date is in the yyyy-mm-dd format
        if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
            // Convert from yyyy-mm-dd to dd-mm-yyyy
            const parts = dateString.split('-');
            return `${parts[2]}-${parts[1]}-${parts[0]}`; // Convert to dd-mm-yyyy
        }
        // If it's already in dd-mm-yyyy format, return as is
        return dateString;
    };

    const startDateString = formatDateString(req.body['start-date']);
    const endDateString = formatDateString(req.body['end-date']);

    const interval = req.body['interval'];

    console.log('req body :',req.body);
    
    // console.log(startDateString);
    // console.log(endDateString);

    // Convert the date strings to Date objects
    const startDate = new Date(startDateString.split('-').reverse().join('-')); // Converts dd-mm-yyyy to yyyy-mm-dd
    const endDate = new Date(endDateString.split('-').reverse().join('-'));

    // console.log(startDate);
    // console.log(endDate);
       
    // Set the time for endDate to the end of the day
    endDate.setHours(23, 59, 59, 999);

    try {
        if (req.session.admin) {
            const orders = await Order.find({
                orderDate: { $gte: startDate, $lte: endDate }
            });

            const grandTotal = orders.reduce((total, order) => {
                // Sum up the prices of all products in each order
                const orderTotal = order.products.reduce((orderSum, product) => orderSum + product.price, 0);
                return total + orderTotal;
            }, 0);
            

            let totalDiscount = 0;

            const users = await User.find({}).populate('cart'); // Fetch all users with their carts

            // Calculate total deductions from all user carts
            const offerDiscount = users.reduce((total, user) => {
                const userCart = user.cart || []; 
                const deductions = userCart.reduce((deductionSum, cart) => {
                    return deductionSum + (cart.Amount - cart.totalPrice); // Calculate deduction for each cart
                }, 0);
                return total + deductions; // Sum up all deductions from all user carts
            }, 0);


            orders.forEach((order)=>{
                totalDiscount += order.couponDiscount || 0; 
            })
            console.log('totalDiscount',totalDiscount);
            

//^ Step 1: Aggregate orders to find total quantity sold for each product
 const salesData = await Order.aggregate([
    { $unwind: "$products" }, 
    {
        $group: {
            _id: "$products.productId", 
            totalSold: { $sum: "$products.quantity" } // Sum the quantities
        }
    },
    { $sort: { totalSold: -1 } }, 
    { $limit: 10 } 
]);

// Step 2: Retrieve product details based on the product IDs
const productIds = salesData.map(item => item._id);
const products = await Product.find({ _id: { $in: productIds } });

// Step 3: Combine the sales data with product details
const topSellingProducts = salesData.map(sale => {
    const product = products.find(p => p._id.equals(sale._id));
    return {
        productName: product ? product.productName : 'Unknown',
        totalSold: sale.totalSold,
    };
});


//^ Step 1: Aggregate for Categories
const categorySalesData = await Order.aggregate([
    { $unwind: "$products" },
    {
        $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productDetails"
        }
    },
    { $unwind: "$productDetails" },
    {
        $group: {
            _id: "$productDetails.category",
            totalSold: { $sum: "$products.quantity" }
        }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
]);

const categoryIds = categorySalesData.map(item => item._id);
const categories = await Category.find({ _id: { $in: categoryIds } });

const topSellingCategories = categorySalesData.map(sale => {
    const category = categories.find(c => c._id.equals(sale._id));
    return {
        categoryName: category ? category.name : 'Unknown',
        totalSold: sale.totalSold,
    };
});

//^ Get top-selling brands
const brandSalesData = await Order.aggregate([
    { $unwind: "$products" },
    {
        $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productDetails"
        }
    },
    { $unwind: "$productDetails" },
    {
        $group: {
            _id: "$productDetails.brand",
            totalSold: { $sum: "$products.quantity" }
        }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
]);

const topSellingBrands = brandSalesData.map(sale => ({
    brandName: sale._id || 'Unknown',
    totalSold: sale.totalSold,
}));

//^for chart
  // Check the difference in months between the start and end dates
  const diffInMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

  let chartData;

  if (diffInMonths >= 11) {
    // Aggregate sales data by month
    const monthlySalesData = await Order.aggregate([
        {
            $match: {
                orderDate: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $unwind: "$products" // Unwind products to access individual items
        },
        {
            $group: {
                _id: { 
                    $dateToString: { format: "%Y-%m", date: "$orderDate" } // Group by year and month
                },
                totalSales: { $sum: "$products.price" }
            }
        },
        { $sort: { _id: 1 } } // Sort by date
    ]);

    // Prepare month labels and totals
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    // Initialize labels and totals
    const labels = [];
    const totals = [];

    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth());
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1); // Include end month

    while (currentDate < endMonth) {
        const monthKey = currentDate.toISOString().slice(0, 7); // Format YYYY-MM
        labels.push(monthNames[currentDate.getMonth()]); // Get month name

        // Find the total sales for the current month
        const monthlySales = monthlySalesData.find(data => data._id === monthKey);
        totals.push(monthlySales ? monthlySales.totalSales : 0); // Default to 0 if no sales

        currentDate.setMonth(currentDate.getMonth() + 1); // Move to next month
    }

    chartData = {
        labels,
        totals
    };
}
 else {
      // Previous daily sales aggregation logic
      const dailySalesData = await Order.aggregate([
          {
              $match: {
                  orderDate: { $gte: startDate, $lte: endDate }
              }
          },
          {
              $unwind: "$products"
          },
          {
              $group: {
                  _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
                  totalSales: { $sum: "$products.price" }
              }
          },
          { $sort: { _id: 1 } }
      ]);

      const allDates = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
          allDates.push(currentDate.toISOString().split('T')[0]); // Format YYYY-MM-DD
          currentDate.setDate(currentDate.getDate() + 1); // Move to next day
      }

      const salesMap = {};
      dailySalesData.forEach(data => {
          salesMap[data._id] = data.totalSales; // Map date to total sales
      });

      chartData = {
          labels: allDates,
          totals: allDates.map(date => salesMap[date] || 0)
      };
  }

res.render("dashboard", { orders ,grandTotal,totalDiscount,offerDiscount,topSellingBrands,topSellingCategories,topSellingProducts,chartData});
            console.log('Report generated successfully..');
        } else {
            return res.redirect("/login"); 
        }
    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ error: "Failed to generate report" });
    }
}






async function generatePDFReport(req, res) {
    try {
        // Fetch orders and corresponding user data
        const orders = await Order.find().populate('userId');

        // Check if orders are an array
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            console.error("No valid orders available for generating report");
            return res.status(400).send("No valid orders available for generating report");
        }

        // Create a new jsPDF instance
        const doc = new jsPDF();

        // Set document title
        doc.setFontSize(24);
        doc.text("Order Report", 10, 10);

        // Set headers
        const headers = ["Sl.", "Order Date", "Customer", "Amount", "Discount", "Total"];
        const headerYPosition = 25; // Adjusted for better spacing
        const dataYStartPosition = headerYPosition + 15; // Start data after headers

        // Draw headers with larger font size and bold text
        doc.setFontSize(12); // Adjusted header size
        doc.setFont("helvetica", "bold"); // Set font to bold
        const headerSpacing = 35; // Fixed spacing between headers

        headers.forEach((header, index) => {
            doc.text(header, 10 + (index * headerSpacing), headerYPosition); // Adjusted spacing between headers
        });

        // Draw a line below the headers
        doc.setDrawColor(0);
        doc.line(10, headerYPosition + 2, 200, headerYPosition + 2); // Line under the headers

        // Add content to PDF
        doc.setFontSize(12); // Standard font size for data
        doc.setFont("helvetica", "normal"); // Reset font to normal
        let verticalPosition = dataYStartPosition; // Starting position for data
        const rowHeight = 8; // Height of each row

        // Initialize totals
        let totalSalesCount = 0;
        let totalOrderAmount = 0;
        let totalDiscount = 0;

        orders.forEach((order, index) => {
            const userName = order.userId ? order.userId.name : "Unknown User"; // Adjust as necessary
            const orderDate = new Date(order.orderDate).toLocaleDateString();
            const discount = order.offerDiscount || 0;
            const total = (order.totalAmount - discount) || 0;

            // Update totals
            totalSalesCount += 1;
            totalOrderAmount += order.totalAmount;
            totalDiscount += discount;

            // Create a formatted structure for each order
            const orderDetails = [
                `${index + 1}`,
                `${orderDate}`,
                `${userName}`,
                `$${order.totalAmount}`,
                `$${discount}`,
                `$${total}`,
            ];

            // Write the order details directly under the headers with alternating row colors
            const rowColor = index % 2 === 0 ? [240, 240, 240] : [255, 255, 255]; // Light gray for even rows
            doc.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
            doc.rect(10, verticalPosition - rowHeight, 200, rowHeight, 'F'); // Fill the row with color

            orderDetails.forEach((detail, dataIndex) => {
                // Adjust for possible long text and use text wrapping
                if (dataIndex === 2) { // Customer name may be long
                    const splitText = doc.splitTextToSize(detail, 50); // Split if too long
                    doc.text(splitText, 10 + (dataIndex * headerSpacing), verticalPosition);
                } else {
                    doc.text(detail, 10 + (dataIndex * headerSpacing), verticalPosition); // Aligning data under headers
                }
            });

            verticalPosition += rowHeight; // Move down for the next line

            // Check if the page limit is reached
            if (verticalPosition > 270) { // Example limit, adjust as necessary
                doc.addPage();
                verticalPosition = dataYStartPosition; // Reset to start position on new page
            }
        });

        // Draw a line under the data
        const lineYPosition = verticalPosition; // Position for the line
        doc.setDrawColor(0);
        doc.line(10, lineYPosition, 200, lineYPosition); // Line under the data

        // Display starting date and ending date
        const startDate = new Date(orders[0].orderDate).toLocaleDateString(); // Adjust as necessary
        const endDate = new Date(orders[orders.length - 1].orderDate).toLocaleDateString(); // Adjust as necessary

        // Add starting date
        doc.text(`Starting Date: ${startDate}`, 10, lineYPosition + 10); // Position under the line
        // Add ending date
        doc.text(`Ending Date: ${endDate}`, 10, lineYPosition + 20); // Position under the starting date

        // Add total sales count, total order amount, and total discount
        doc.text(`Total Sales Count: ${totalSalesCount}`, 10, lineYPosition + 30);
        doc.text(`Total Order Amount: $${totalOrderAmount.toFixed(2)}`, 10, lineYPosition + 40);
        doc.text(`Total Discount: $${totalDiscount.toFixed(2)}`, 10, lineYPosition + 50);

        // Add a footer with the date
        const currentDate = new Date().toLocaleDateString();
        doc.setFontSize(10);
        doc.text(`Generated on: ${currentDate}`, 10, 290); // Adjust position as necessary

        // Save the PDF and send it to the client
        const pdfOutput = doc.output();
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=order_report.pdf',
            'Content-Length': pdfOutput.length,
        });

        res.send(pdfOutput);
    } catch (error) {
        console.error("Error generating PDF report:", error);
        res.status(500).send("Error generating report");
    }
}





const ExcelJS = require('exceljs');

async function generateExcelReport(req, res) {
    try {
        // Fetch orders and corresponding user data
        const orders = await Order.find().populate('userId');

        // Check if orders are an array
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            console.error("No valid orders available for generating report");
            return res.status(400).send("No valid orders available for generating report");
        }

        // Create a new Excel workbook
        const workbook = new ExcelJS.Workbook();

        // Create a new worksheet
        const worksheet = workbook.addWorksheet('Sales Report');

        // Add headers
        worksheet.addRow([
            'Sl.',
            'Order Date',
            'Customer',
            'Amount',
            'Discount',
            'Total',
        ]);

        // Add orders to the worksheet
        let index = 1;
        orders.forEach((order) => {
            const userName = order.userId ? order.userId.name : "Unknown User";
            const orderDate = new Date(order.orderDate).toLocaleDateString();
            const discount = order.offerDiscount || 0;
            const total = (order.totalAmount - discount) || 0;

            worksheet.addRow([
                index,
                orderDate,
                userName,
                order.totalAmount,
                discount,
                total,
            ]);

            index++;
        });

        // Save the workbook to a buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Send the buffer as a response
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=sales_report.xlsx',
            'Content-Length': buffer.length,
        });

        res.send(buffer);
    } catch (error) {
        console.error("Error generating Excel report:", error);
        res.status(500).send("Error generating report");
    }
}

module.exports = {
    pageerror,
    loadLogin,
    login,
    logout,
    generateReport,
    generatePDFReport,
    generateExcelReport,
}