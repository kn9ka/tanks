/* module dependencies */
import path from 'path'
import bodyParser from 'body-parser'
import express from 'express'
import logger from 'morgan'
import session from 'express-session'
import passport from 'passport'
import mongoose from 'mongoose'
import slashes from 'connect-slashes'

/* class & routes dependencies */
import gameServer from './models/local/gameserver'
import Ball from './models/local/ball'
import Hit from './models/local/hit'
import index from './routes/routes'

/* db connect */
mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/' + 'panzer')
const MongoStore = require("connect-mongo")(session)
console.log(':: connected to database ::')

/* constants and others */
const getRandomInt = (min, max) => { return Math.floor(Math.random() * (max - min)) + min}
const TANK_INIT_HP = 100

let default_bullet_type = 1
let counter = 0

const app = express()
const localGame = new gameServer()

require('./config/passport')

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
	console.log('User connected')

	client.on('joinGame', tank => {
		console.log(tank.id + ' joined the Game')

		let initX = getRandomInt(40, 800) 
		let initY = getRandomInt(40, 400) 
		// client => server: hey, I need tank.
		client.emit('addTank', { 
			id: tank.id, 
			type: tank.type, 
			isLocal: true, 
			x: initX, 
			y: initY, 
			hp: TANK_INIT_HP, 
			collars: {
				currentBulletType: default_bullet_type,
				normBulletCount: 9999, 
				goldBulletCount: 10 },
		})
		
		// server => add new tank please
		client.broadcast.emit('addTank', { 
			id: tank.id, 
			type: tank.type, 
			isLocal: false, 
			x: initX, 
			y: initY, 
			hp: TANK_INIT_HP,
			collars: {
				currentBulletType: default_bullet_type,
				normBulletCount: 9999, 
				goldBulletCount: 10},
		})
		
		localGame.addTank({ 
			id: tank.id, 
			type: tank.type, 
			hp: TANK_INIT_HP, 
			collars: {
				currentBulletType: default_bullet_type,
				normBulletCount: 9999, 
				goldBulletCount: 10},
		})
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
		counter ++
	})

	client.on('bulletChange', data => {
		default_bullet_type = data.bulletType
		console.log('new bullet type:', data.bulletType)
		localGame.switchBulletType (data.id, data.bulletType)
	})
	
	client.on('shoot', bullet => {
		let ball = new Ball(localGame.previousId, bullet.ownerId, bullet.alpha, bullet.x, bullet.y, bullet.type)
		
		localGame.increasePreviousId()
		localGame.addBall(ball)
		
		let hit = new Hit (localGame.previousId, bullet.ownerId, 0)
		localGame.addHit(hit)
	})

	client.on('leaveGame', tankId => {
		console.log(tankId + ' has left the Game')
		localGame.removeTank(tankId)
		client.broadcast.emit('removeTank', tankId)
	})
	
	client.on('gameover', tankId => {
		let clientHits = localGame.hits.filter(x => {return x.bulletOwnerId === tankId})
	})
})