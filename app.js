const express = require("express");
const app = express();
const path = require("path");
const nocache = require('nocache');
const session = require("express-session");
const flash = require('express-flash');
const passport = require("./config/passport");
const dotenv = require("dotenv");
dotenv.config();
const db = require("./config/db");
db();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000 // 72hrs
  }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use((req, res, next) => {
  res.set('cache-control', 'no-store');
  next();
});

app.use(nocache());


app.set("view engine", "ejs");
app.set('views', [path.join(__dirname, "views/user"), path.join(__dirname, "views/admin")]);
app.use(express.static("public"));

const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");

app.use('/admin', adminRouter);
app.use("/", userRouter);


app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log("failed to start server", err);
  } else {
    console.log(`server is running on http://localhost:${process.env.PORT}`);
  }
});

module.exports = app;



// netstat -ano | findstr :3002
// taskkill /PID <PID> /F
// npx kill-port 3002

