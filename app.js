/* module dependencies */
import path from 'path'
import bodyParser from 'body-parser'
import express from 'express'
import logger from 'morgan'
import session from 'express-session'
import passport from 'passport'
import mongoose from 'mongoose'
import slashes from 'connect-slashes'

/* controllers */
import gameServer from './controllers/gameserver'

/* class & routes dependencies */
import Player from './models/player'
import Ball from './models/ball'
import Hit from './models/hit'
import index from './routes/routes'
import gameSettings from './config/settings'

/* db connect */
mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/' + 'panzer')
const MongoStore = require("connect-mongo")(session)

/* constants and others */
const getRandomInt = (min, max) => { return Math.floor(Math.random() * (max - min)) + min}
const TANK_INIT_HP = gameSettings.TANK_INIT_HP
const WIDHT = gameSettings.ARENA_WIDTH
const HEIGHT = gameSettings.ARENA_HEIGHT

let shootsCounter = 0

/* app */
const app = express()
const localGame = new gameServer()
require('./controllers/passport')

/* server */
app.use(logger('dev'))
app.set('view engine', 'pug')
app.use(session ({
	store: new MongoStore({mongooseConnection: mongoose.connection}),
	secret: 'mysupersecret',
	resave: true,
	saveUninitialized: true,
	cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
}))
app.use(bodyParser.urlencoded({extended: false}))
app.use(passport.initialize())  
app.use(passport.session())

/* routes */
app.use(express.static(path.join(__dirname,'views')))
app.use(slashes())
app.use('/', index)

const server = app.listen(process.env.PORT || 8080, () => {
	let port = server.address().port
	console.log(':: panzers-knyaka.c9users.io :: port => %s \n', port)
})

const io = require('socket.io')(server)

/* io client handle events */

io.on('connection', client => {

	let newPlayer = new Player (client.id, client.handshake.query.username)
	localGame.addPlayer(newPlayer)
	
	client.on('joinGame', tank => {
		
		localGame.inGame(client.id, tank.id)
		
		let initX = getRandomInt(40, WIDHT) 
		let initY = getRandomInt(40, HEIGHT)
		
		let newtank = {
			id: tank.id,
			type: tank.type,
			isLocal: true,
			x: initX,
			y: initY,
			hp: TANK_INIT_HP,
			collars: {
				currentBulletType: 1,
				normBulletCount: 0,
				goldBulletCount: 10
			}
		}
		
		client.emit('addTank', newtank)
		localGame.addTank(newtank)
		
		newtank.isLocal = false
		client.broadcast.emit('addTank', newtank)

	})

	client.on('sync', data => {
		//Receive data from clients
		if(data.tank != undefined) {
			localGame.syncTank(data.tank)
		}
		
		//update ball positions
		localGame.syncBalls()

		//Broadcast data to clients
		client.emit('sync', localGame.getData())
		client.broadcast.emit('sync', localGame.getData())

		//I do the cleanup after sending data, so the clients know
		//when the tank dies and when the balls explode
		localGame.cleanDeadTanks()
		localGame.cleanDeadBalls()
		localGame.calcStat()
	})

	client.on('bulletChange', data => {
		localGame.switchBallType(data.id, data.bulletType)
	})
	
	client.on('shoot', bullet => {
		let ball = new Ball(shootsCounter, bullet.ownerId, bullet.alpha, bullet.x, bullet.y, bullet.type)
		let hit  = new Hit (shootsCounter, bullet.ownerId)
		
		// if is hitted add gold bullet for ball hitowner
		localGame.controlCollars(bullet.ownerId)
		localGame.addBall(ball)
		localGame.addHit(hit)
		shootsCounter ++
	})

})