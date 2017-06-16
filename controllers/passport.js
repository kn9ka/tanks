import passport from 'passport'
import configAuth from '../config/auth'
import User from '../models/user'

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const LocalStrategy = require('passport-local').Strategy


passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((id, done) => {
	User.findById(id, (err, user) => {
		done(err, user)
	})
})

passport.use('local-signup', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	}, (req, email, password, done) => {
			User.findOne({'local.username': email}, (err, user) => {
				if(err)	
				    return done(err)
				if(user) {
				    return done(null, false)
				} else {
					let newUser = new User()
					newUser.local.username = email
					newUser.local.password = newUser.generateHash(password)

					newUser.save((err) => {
						if(err)	throw err
						return done(null, newUser)
					})
				}
			})
        }
))

passport.use('local-login', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	}, (req, email, password, done) => {
			User.findOne({ 'local.username': email}, (err, user) => {
				if(err)
					return done(err)
				if(!user)
					return done(null, false)
				if(!user.validPassword(password)){
					return done(null, false)
				}
				return done(null, user)
			})
	    }
))

passport.use(new GoogleStrategy({
	    clientID: configAuth.googleAuth.clientID,
	    clientSecret: configAuth.googleAuth.clientSecret,
	    callbackURL: configAuth.googleAuth.callbackURL,
	  }, (token, refreshToken, profile, done) => {
            User.findOne({'google.id' : profile.id}, (err, user) => {
                if (err) 
                    return done(err)
                if (user) 
                    return done(null, user)
                else {
                    let newUser = new User ()
                    newUser.google.id = profile.id
                    newUser.google.token = token
                    newUser.google.name = profile.displayName
                    newUser.google.email = profile.emails[0].value
                
                    newUser.save( err => {
                        if (err) throw err
                        return done(null, newUser)
                    })
                }
            })
      })
)