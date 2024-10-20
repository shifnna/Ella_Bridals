const express = require('express');
const router = express.Router();
const User = require("../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// <% if (message) { %>
//     <div style="color: red;"><%= message %></div>
// <% } %>

const forgotPassword = async (req,res)=>{
    try {
        let message = req.query.message ||''
        return res.render("forgotPassword",{message})
    } catch (error) {
        console.error(error);
        return redirect("/pageerror")               
    }
}


const loadVerifyForgotOtp = async (req,res)=>{
    try {
        let message = req.query.message ||''
        return res.render("verifyForgotOtp",{message})
    } catch (error) {
        console.error(error);
        return redirect("/pageerror")               
    }
}


const resetPassword = async (req,res)=>{
    try {
        let message = req.query.message ||''
        return res.render("resetPass",{message})
    } catch (error) {
        console.error(error);
        return redirect("/pageerror")               
    }
}

function generateOtp(length) {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
}

async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: 'Verify Your Account',
            text: `Your OTP is ${otp}`,
        });

        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}


const sendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.redirect("/forgotPassword?message=Email Not Found, please try again.");
        }

        const otp = generateOtp(6);
        req.session.forgotPasswordOtp = otp;
        req.session.forgotPasswordEmail = email;

        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.redirect("/forgotPassword?message=Error sending OTP, please try again.");
        }

        console.log('otp:',otp);
        
        res.redirect("/verifyForgotOtp")
    } catch (error) {
        console.error('Error sending OTP:', error);
        return res.redirect("/pageerror")
    }
};



const verifyForgotOtp = async (req, res) => {
    const { otp } = req.body;

    if (req.session.forgotPasswordOtp && otp.trim() === req.session.forgotPasswordOtp) {
        res.redirect("/resetPassword"); // Render password reset page
    } else {
        res.redirect("/verifyForgotOtp?message=Invalid OTP, please try again.");
    }
};



const updatePassword =  async (req, res) => {
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.redirect("/resetPassword?message=Passwords do not match.");
    }

    try {
        const hashedPassword = await securePassword(newPassword); // Use your hashing function
        await User.updateOne({ email: req.session.forgotPasswordEmail }, { password: hashedPassword });

        const updateResult = await User.updateOne(
            { email: req.session.forgotPasswordEmail },
            { password: hashedPassword }
        );
        console.log('Update result:', updateResult); // Debugging line
        
        req.session.forgotPasswordOtp = null; // Clear OTP from session
        req.session.forgotPasswordEmail = null; // Clear email from session

        res.redirect('/login'); // Redirect to login page after successful reset
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).send('Server error');
    }
};



const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        console.log('Hashed password:', passwordHash); // Debugging line
        return passwordHash;
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}


module.exports = {
    forgotPassword,
    sendOtp,
    verifyForgotOtp,
    updatePassword,
    loadVerifyForgotOtp,
    resetPassword,
}