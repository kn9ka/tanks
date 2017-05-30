import passport from 'passport'
import configAuth from './auth'
import User from '../models/user'

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
const LocalStrategy = require('passport-local').Strategy

passport.serializeUser((user, done) => {
	console.log('serializing user.')
  done(null, user.id)
})

passport.deserializeUser(function(id, done){
	User.findById(id, function(err, user){
		done(err, user);
	});
});

const processRequest = (token, refreshToken, profile, done) => {
    process.nextTick(() => {
        User.findOne({'google.id' : profile.id}, (err, user) => {
            if (err) return done(err)
            if (user) return done(null, user)
            else {
                var newUser = new User ()
                newUser.google.id = profile.id
                newUser.google.token = token;
                newUser.google.name = profile.displayName;
                newUser.google.email = profile.emails[0].value;
                
                newUser.save( err => {
                    if (err) throw err
                    return done(null, newUser)
                })
            }console.log(profile)
        })
    });
};

passport.use('local-signup', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done){
		process.nextTick(function(){
			User.findOne({'local.username': email}, function(err, user){
				if(err)
					return done(err);
				if(user){
					return done(null, false);
				} else {
					var newUser = new User();
					newUser.local.username = email;
					newUser.local.password = newUser.generateHash(password);

					newUser.save(function(err){
						if(err)
							throw err;
						return done(null, newUser);
					})
				}
			})

		});
	}));

passport.use('local-login', new LocalStrategy({
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true
	},
	function(req, email, password, done){
		process.nextTick(function(){
			User.findOne({ 'local.username': email}, function(err, user){
				if(err)
					return done(err);
				if(!user)
					return done(null, false);
				if(!user.validPassword(password)){
					return done(null, false);
				}
				return done(null, user);

			});
		});
	}
));


passport.use(new GoogleStrategy({
	    clientID: configAuth.googleAuth.clientID,
	    clientSecret: configAuth.googleAuth.clientSecret,
	    callbackURL: configAuth.googleAuth.callbackURL,
	  }, processRequest))

console.log(':: passport strategy loaded ::')