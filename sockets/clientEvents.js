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
