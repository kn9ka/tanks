import express from 'express'
import passport from 'passport'

const router = express.Router()


router.get('/', (req, res) => {
    res.render('index', {user: req.user}) // user already logged in?
})

router.get('/login', (req, res) => {
    res.render('user/login')
})

router.get('/signup', (req, res) => {
    res.render('user/signup')
})


router.get('/profile', isLoggedIn, (req, res) => {
	res.render('user/profile', { user: req.user })
})

router.get('/logout', (req, res) => {
    req.session.destroy()
    req.logout()
	res.redirect('/')
})

router.get('/game', isLoggedIn, (req, res) => {
	let username
	if (req.user.local.username === undefined) {
		username = req.user.google.email
	} else {
		username = req.user.local.username
	}
    res.render('game/index', {user: username})
})

router.get('/stats', isLoggedIn, (req, res) => {
	res.render('game/stats')
})

router.get('/auth/google', passport.authenticate('google', {scope: ['profile','email']}))

router.get('/auth/google/callback', passport.authenticate('google', {
	successRedirect: '/profile',
	failureRedirect: '/' 
}))

router.post('/login', passport.authenticate('local-login', {
	successRedirect: '/profile',
	failureRedirect: '/login',
}))

router.post('/signup', passport.authenticate('local-signup', {
	successRedirect: '/profile',
	failureRedirect: '/login',
}))

export default router

function isLoggedIn (req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
}