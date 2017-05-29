/* module dependencies */
import path from 'path'
import bodyParser from 'body-parser';
import express from 'express'
import logger from 'morgan'
import session from 'express-session'
import passport from 'passport'

/* class dependencies */
import gameServer from './models/client/gameserver'
import Ball from './models/client/ball'


const getRandomInt = (min, max) => { return Math.floor(Math.random() * (max - min)) + min;}
const TANK_INIT_HP = 100
let counter = 0

const app = express()
const router = express.Router()
const game = new gameServer()
const RedisStore = require("connect-redis")(session)
let sessionStore = new RedisStore({host: 'localhost', port: 6379 })

require('./config/passport')

/* server */
app.use(logger('dev'))
app.use(express.static(__dirname + '/views'))

app.use(session ({
	store: sessionStore,
	secret: 'mysupersecret',
	resave: true,
	saveUninitialized: true,
	cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
}))
app.use(bodyParser.urlencoded({extended: false}))
app.use(passport.initialize())  
app.use(passport.session())

app.get('/auth/google', passport.authenticate('google', {scope: ['profile','email']}));
app.get('/auth/google/callback', passport.authenticate('google', {
	successRedirect: '/game',
	failureRedirect: '/' }));


const server = app.listen(process.env.PORT || 8080, () => {
	let port = server.address().port
	console.log(':: panzers-knyaka.c9users.io :: port => %s \n', port)
})


const io = require('socket.io')(server)

/* io client handle events */

io.on('connection', client => {
	console.log('User connected')

	client.on('joinGame', tank => {
		console.log(tank.id + ' joined the game')

		var initX = getRandomInt(40, 900)
		var initY = getRandomInt(40, 500)
		// client => server: hey, I need tank.
		client.emit('addTank', { id: tank.id, type: tank.type, isLocal: true, x: initX, y: initY, hp: TANK_INIT_HP })
		// server => add new tank please
		client.broadcast.emit('addTank', { id: tank.id, type: tank.type, isLocal: false, x: initX, y: initY, hp: TANK_INIT_HP} )
		game.addTank({ id: tank.id, type: tank.type, hp: TANK_INIT_HP});
	})

	client.on('sync', data => {
		//Receive data from clients
		if(data.tank != undefined) {
			game.syncTank(data.tank)
		}
		//update ball positions
		
		game.syncBalls()
		//Broadcast data to clients
		client.emit('sync', game.getData())
		client.broadcast.emit('sync', game.getData())

		//I do the cleanup after sending data, so the clients know
		//when the tank dies and when the balls explode
		game.cleanDeadTanks()
		game.cleanDeadBalls()
		counter ++
	})

	client.on('shoot', ball => {
		var ball = new Ball(game.lastBallId, ball.ownerId, ball.alpha, ball.x, ball.y)
		game.increaseLastBallId()
		game.addBall(ball)
	})

	client.on('leaveGame', tankId => {
		console.log(tankId + ' has left the game')
		game.removeTank(tankId)
		client.broadcast.emit('removeTank', tankId)
	})
	
})