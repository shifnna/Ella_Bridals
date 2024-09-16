const User = require("../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");




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

        const admin =await User.findOne({email,isAdmin:true});
        
        if(admin){
            const passwordMatch = bcrypt.compare(password,admin.password);

            if(passwordMatch){
                req.session.admin = true;
                return res.render("dashboard");
                
            }else{
                return res.render("loginPage",{message:"incorrect email or password "});
            }

        }else{
            return res.render("loginPage",{message:"incorrect email or password "});
        }

    } catch (error) {
        console.log("login error",error);
        return res.redirect("/pageerror")
        
    }
}

const logout= async (req,res)=>{
    req.session.destroy((err) => {
        if (err) {
            console.log("Error destroying session:", err);
            return res.redirect("/admin/pageerror"); // Redirect to error page only on session destruction failure
        }
        res.clearCookie('connect.sid', { path: '/admin/login' }); // Clear the session cookie
        return res.redirect("/admin/login"); // Redirect to the login page after successful logout
    });
}


module.exports = {
    pageerror,
    loadLogin,
    login,
    logout,
    
}