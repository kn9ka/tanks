import express from 'express'
import passport from 'passport'

const router = express.Router()

router.get('/', (req, res) => {
    res.render('index', {user: req.user})
})

router.get('/login', (req, res) => {
    res.render('login')
})

router.post('/login', passport.authenticate('local-login', {
	successRedirect: '/profile',
	failureRedirect: '/login',
}))

router.get('/signup', (req, res) => {
    res.render('signup')
})

router.post('/signup', passport.authenticate('local-signup', {
	successRedirect: '/profile',
	failureRedirect: '/login',
}))

router.get('/profile', isLoggedIn, (req, res) => {
	res.render('profile', { user: req.user })
})


router.get('/logout', (req, res) => {
    req.session.destroy()
    req.logout()
	res.redirect('/')
})

router.get('/game', isLoggedIn, (req, res) => {
	let username = req.user
	if (req.user.local.username == undefined) {
		username = req.user.google.email
	} else {
		username = req.user.local.username
	}
    res.render('game/index', {user: username})
})

router.get('/auth/google', passport.authenticate('google', {scope: ['profile','email']}))

router.get('/auth/google/callback', passport.authenticate('google', {
	successRedirect: '/profile',
	failureRedirect: '/' }))
	
router.get('/test', (req, res) => {
	res.render('test')
})

export default router

function isLoggedIn (req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
}