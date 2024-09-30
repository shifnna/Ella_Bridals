const User = require("../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Order = require("../models/orderSchema");
const XLSX = require('exceljs');
const { jsPDF } = require('jspdf'); // Importing correctly based on the version
require("jspdf-autotable"); // Import autotable plugin




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
        
        const {email,password} = req.body;

        const admins =await User.findOne({email,isAdmin:true});
        
        if(req.session.admin){
            const orders = [];
            const grandTotal = 0;
            const totalDiscount = 0;
            const offerDiscount = 0;
            
         return res.render("dashboard", {orders,grandTotal,totalDiscount,offerDiscount});
          
            }else if(admins){
                req.session.admin = true;
                const passwordMatch = bcrypt.compare(password,admins.password);

                if(passwordMatch){
                    req.session.admin = true;
                    const orders = [];
                    const grandTotal = 0;
                    const totalDiscount = 0;
                    const offerDiscount = 0;
                    
                 return res.render("dashboard", {orders,grandTotal,totalDiscount,offerDiscount});    
                
            }
            else{
                return res.render("loginPage",{message:"incorrect email or password "});
            }

        }else{
            return res.render("loginPage",{message:"incorrect email or password "});
        }

    } catch (error) {
        console.log("login error",error);
        return res.render("page_404")
        
    }
}

const logout= async (req,res)=>{
    req.session.destroy((err) => {
        if (err) {
            console.log("Error destroying session:", err);
            return res.redirect("admin/pageerror"); // Redirect to error page only on session destruction failure
        }
        res.clearCookie('connect.sid', { path: '/admin/login' }); // Clear the session cookie
        return res.redirect("/admin/login"); // Redirect to the login page after successful logout
    });
}


const generateReport = async (req, res) => {
    const startDateString = req.body['start-date'];
    const endDateString = req.body['end-date'];

    // Convert the date strings to Date objects
    const startDate = new Date(startDateString.split('-').reverse().join('-')); // Converts dd-mm-yyyy to yyyy-mm-dd
    const endDate = new Date(endDateString.split('-').reverse().join('-'));

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
                const userCart = user.cart || []; // Get the user's cart, default to empty array if undefined
                const deductions = userCart.reduce((deductionSum, cart) => {
                    return deductionSum + (cart.Amount - cart.totalPrice); // Calculate deduction for each cart
                }, 0);
                return total + deductions; // Sum up all deductions from all user carts
            }, 0);


             totalDiscount = orders.reduce((discountTotal, order) => {
                const orderDiscount = order.products.reduce((productDiscountSum, product) => {
                    // Calculate the discount for each product as (salePrice - offerPrice)
                    const discount = (product.salePrice || 0) - (product.offerPrice || 0);
                    return productDiscountSum + (discount > 0 ? discount : 0); // Ensure only positive discounts
                }, 0);
                return discountTotal + orderDiscount;
            }, 0);

            res.render("dashboard", { orders ,grandTotal,totalDiscount,offerDiscount});
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