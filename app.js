import express from 'express'
import logger from 'morgan'
import gameServer from './models/gameserver'
import Ball from './models/ball'
import session from 'express-session'
import cookieParser from 'cookie-parser'


const getRandomInt = (min, max) => { return Math.floor(Math.random() * (max - min)) + min;}
const TANK_INIT_HP = 100
let counter = 0

const app = express()
const game = new gameServer()
const RedisStore = require("connect-redis")(session)
let sessionStore = new RedisStore({host: 'localhost', port: 6379 })

//Static resources server
app.use(logger('dev'))
app.use(express.static(__dirname + '/views'))
app.use(cookieParser())
app.use(session ({
	key: 'connect.sid',
	secret: 'mysupersecret',
	store: sessionStore,
	resave: true,
	saveUninitialized: true,
	cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
}))

const server = app.listen(process.env.PORT || 8080, () => {
	let port = server.address().port
	console.log(':: panzers-knyaka.c9users.io :: port => %s \n', port)
})

const io = require('socket.io')(server)
// io events

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