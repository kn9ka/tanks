import passport from 'passport'
import configAuth from './auth'

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;


passport.serializeUser((user, done) => {
  done(null, user.id)
})

// FIXED dat shit {redis issue}
passport.deserializeUser((obj, done) => {
  done(null, false)  // invalidates the existing login session.
})

passport.use(new GoogleStrategy({
	    clientID: configAuth.googleAuth.clientID,
	    clientSecret: configAuth.googleAuth.clientSecret,
	    callbackURL: configAuth.googleAuth.callbackURL
	  }, (accessToken, refreshToken, profile, done) => {
	      return done(null, profile)
}))

console.log(':: passport strategy loaded ::')