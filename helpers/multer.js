const multer = require("multer");
const path = require("path");
const fs = require("fs")


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dirPath = path.join(__dirname, "../public/imgs/productImages");

        // Check if the directory exists, if not, create it
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true }); // creates the directory and its parent directories if necessary
        }

        cb(null, dirPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname); 
    }
});




module.exports = storage
