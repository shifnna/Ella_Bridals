

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

module.exports = {
    loadHomePage,
    loadSignup,
}