import express from 'express'
import passport from 'passport'

const router = express.Router()

router.get('/', (req, res) => {
    res.render('index')
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
	console.log(req.user)
	
})

router.get('/logout', (req, res) => {
    req.session.destroy()
    req.logout()
	res.redirect('/')
})

router.get('/game', isLoggedIn, (req, res) => {
    res.render('game/index')
})

router.get('/auth/google', passport.authenticate('google', {scope: ['profile','email']}))

router.get('/auth/google/callback', passport.authenticate('google', {
	successRedirect: '/profile',
	failureRedirect: '/' }))

export default router

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect('/');
}

