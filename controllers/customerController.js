const User = require("../models/userSchema");

const loadCustomers = async (req,res)=>{
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
    
            const userData = await User.find({
                isAdmin:false,
                $or:[
                    {name:{$regex:".*"+search+".*"}},
                    {email:{$regex:".*"+search+".*"}}
                ],
    
            }).sort({createdOn:1}).limit(limit*1).skip((page-1)*limit).exec()//chain of promise ne combine cheyyan
    
        const count = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}}
            ],
        }).countDocuments();
        
        const totalPages = Math.ceil(count / limit);
    
        res.render("customers", { data: userData, totalPages: totalPages, currentpage: page, search: search });            
        
    } catch (error) {
        console.error(error);
        
    }
}





const customerBlocked = async (req,res)=>{
    try {
            let id=req.query.id;
            await User.updateOne({_id:id},{$set:{isBlocked:true}});
            res.redirect("/admin/customers");            
       
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
};






const customerunBlocked = async (req,res)=>{
    try {
            let id=req.query.id;
            await User.updateOne({_id:id},{$set:{isBlocked:false}});
            res.redirect("/admin/customers");            
        
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror");
    }
}






module.exports = {
    loadCustomers,
    customerBlocked,
    customerunBlocked,
}