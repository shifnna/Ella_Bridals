const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require("../models/userSchema");
const { json } = require('express');
const env = require('dotenv').config();


passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"http://localhost:3002/auth/google/callback"

},async(accessToken,refreshToken,profile,done)=>{
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            // User exists, proceed with login
            return done(null, user);
        } else {
            // Create new user
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                wallet: 0
            });

            await user.save();
            return done(null, user);
        }
    } catch (error) {
    console.error("Error during authentication:", error);  
    // Check if the error is due to a duplicate email
    if (error.code === 11000) {
        // Redirect to a login page with a friendly error message
        return done(null, false, { message: 'A user with this email already exists. Please try logging in.' });
    }
    // General error handling
    return done(null, false, { message: 'An error occurred during authentication. Please try again.' });
}
   }

));



passport.serializeUser((user,done)=>{
    done(null,user.id)
})

passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user=>{
        done(null,user);
    }).catch(err=>{
        done(err,null);
    })
})


module.exports = passport;