const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const db = require("./config/db");
db();
const userRouter = require("./routes/userRouter")
const adminRouter = require("./routes/adminRouter")





app.use(express.json());
app.use(express.urlencoded({extended:true})); //^ for handle url datas


app.set("view engine","ejs");
app.set('views',[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")]);    
app.use(express.static(path.join(__dirname,"public")));



app.use("/",userRouter);
// app.use('/admin',adminRouter);



app.listen(process.env.PORT,(err)=>{
  if(err){
    console.log("failed to start server",err);  
  }else{
    console.log(`server is running on http://localhost:${process.env.PORT}`);
  }
   
})



module.exports = app;
