
const User = require("../models/userSchema");

async function userMiddleware(req, res, next) {
    try {
        if (!req.session.user) {
            return res.redirect("/login");
        }
        req.userId = req.session.user;
        let user = await User.findById(req.userId);

        if (!user || user.isBlocked) {
            return res.redirect("/login");
        }
        next();
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.redirect("/login"); 
    }
}


async function adminMiddleware(req,res,next) {
    try {
        if(!req.session.admin){
            return res.redirect("/admin/login");
        }
        next();
    } catch (error) {
        console.error("Error fetching admin:", error);
        return res.redirect("/admin/login"); 
    }
}


module.exports={
    userMiddleware,
    adminMiddleware,
}