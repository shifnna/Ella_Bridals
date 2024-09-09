const User = require("../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();




const pageNotFound = async (req,res) => {
    try {
        res.render('page_404')
    } catch (error) {
        res.redirect()
    }
}


const loadHomePage = async (req,res)=>{
    try {
        // const user = req.session.user;
        return res.render("home")
    } catch (error) {
        console.log("home page not found",error);
        res.status(500).send("server eror")
    }
}



const loadSignup = async (req,res) => {
    try {
        return res.render("signup")
    } catch (error) {
        console.log("home page not loading",error);
        res.status(500).send("server error")
        
    }
}





function generateOtp(length) {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);  // Generates a digit between 0 and 9
    }
    return otp;
}


async function sendVerificationEmail(email,otp){
     try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            // port: 587,
            // secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.NODEMAILER_EMAIL, // Your email
                pass: process.env.NODEMAILER_PASSWORD, // Your email password or app password
            },
            tls: {
                rejectUnauthorized: false,
            },
        });        
        
        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,//email parameter
            subject:"verify your account",
            text:`Your OTP is ${otp}`,
            // html:`<b> Your OTP ${otp} </b>`
        });

        if(info.accepted.length >0){
            console.log("successfully sent to a email");           
        }

        return info.accepted.length >0 //& important 
        // console.log("info:",info);


      } catch (error) {
            console.error('error sending email',error);
            return false;
            
      }
}



const signup = async (req,res)=>{
   
    try {

        const {name,email,phone,password,cpassword} = req.body;

        if(password!=cpassword){
            return res.render("signup",{message:"passwords do not match"});
          }
    
          const findUser = await User.findOne({email});
    
          if(findUser){
            return res.render("signup",{message:"User with this email already exists"});
          }

          const otp = generateOtp(6);
          
          const emailSend = await sendVerificationEmail(email,otp);

          if(!emailSend){
          return res.json("email-error");
          }

          req.session.userOtp=otp;
          req.session.userData={name,phone,email,password}


          res.render("verify-otp");
          console.log("OTP sent :",otp);


    } catch (error) {
        console.error("error for save user",error);
        res.status(500).send("internal server error")
    }
}




const securePassword = async (password)=>{
    try {
       const passwordHash = await bcrypt.hash(password, 10);
       return passwordHash;
    } catch (error) {
       
    }
}

const verifyOtp = async (req,res)=>{
    try {
        const {otp} = req.body;
        console.log(otp);

        if(otp===req.session.userOtp){
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);
            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            })
            await saveUserData.save();
            req.session.user = saveUserData. _id,
            res.json({success:true,redirectUrl:"/"});
        }else{
            res.status(400).json({success:false , message:"invalid OTP, please try again"});
          
        }
        
    } catch (error) {
        console.error("error verifying otp",error);
        res.status(500).json({success:false,message:"an error occure"})
            
    }
}



const resendOtp = async (req,res)=>{
    try {
     const {email}= req.session.userData;

     if(!email){
        return res.status(400).json({success:false,message:"Email not found in session"})
     }
    
 const otp = generateOtp();
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


const loadLogin = async (req,res)=>{
    try {
        if(!req.session.user){
            return res.render("login")
        }else{
            redirect("/");
        }
     } catch (error) {
        res.redirect("/pageNotFound")
     }
}



const login = async (req,res)=>{
     try {
        const {email,password} = req.body;
        const findUser =await User.findOne({email:email,isAdmin:false});
        
        if(!findUser){
            return res.render("login",{message:"User not found"});
        }

        if(findUser.isBlocked){
            return res.render("login",{message:"User is blocked by admin"})
        }

        if (!findUser.password) {
            return res.render("login", { message: "Password not found in database" });
        }

        const passMatch = await bcrypt.compare(password, findUser.password);

        if(!passMatch){
            return res.render("login",{message:"incorrect password"});
        }

        req.session.user = findUser._id;
        res.redirect("/");
     } catch (error) {
        console.error("login error",error);
        res.render("login",{message:'login failed.. please try again'})
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
}