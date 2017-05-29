import gameSettings from '../../config/settings'

module.exports = class gameServer {
	
	constructor(tanks, balls, lastBallId) {
		this.tanks = []
		this.balls = []
		this.lastBallId = []
	}
	
	addTank(tank) {
		this.tanks.push(tank)
	}
	
	addBall(ball) {
		this.balls.push(ball)
	}
	
	removeTank(tankId) {
		//remove tank object
		this.tanks = this.tanks.filter( t => {return t.id != tankId} )
	}
	
	syncTank (newTankData) {
		//Sync tank with new data received from a client
		this.tanks.forEach( tank => {
			if(tank.id === newTankData.id) {
				tank.x = newTankData.x
				tank.y = newTankData.y
				tank.baseAngle = newTankData.baseAngle
				tank.cannonAngle = newTankData.cannonAngle
			}
		})
	}
	
	syncBalls() {
		let self = this
		let WIDTH = gameSettings.ARENA_WIDTH
		let HEIGHT = gameSettings.ARENA_HEIGHT
	
		//Detect when ball is out of bounds
		this.balls.forEach( ball => {
			self.detectCollision(ball)
			
			if(ball.x < 0 || ball.x > WIDTH
			|| ball.y < 0 || ball.y > HEIGHT){
				ball.out = true
			} else {
				ball.fly()
			}
		})
	}
	
	detectCollision(ball) {
		//Detect if ball collides with any tank
		let self = this
		
		this.tanks.forEach( tank => {
			if (tank.id != ball.ownerId 
				&& Math.abs(tank.x - ball.x) <30
				&& Math.abs(tank.y - ball.y) < 30){
					//Hit tank
					self.hurtTank(tank)
					ball.out = true
					ball.exploding = true
				}
		})
	}
	
	hurtTank (tank) {
		tank.hp -= 2
	}
	
	getData () {
		let gameData = {}
		gameData.tanks = this.tanks
		gameData.balls = this.balls
		
		return gameData
	}
	
	cleanDeadTanks () {
		this.tanks = this.tanks.filter ( t => { return t.hp > 0})
	}
	
	cleanDeadBalls () {
		this.balls = this.balls.filter (ball => { return !ball.out})
	}
	
	increaseLastBallId () {
		this.lastBallId ++
		if (this.lastBallId > 1000) {
			this.lastBallId = 0
		}
	}
}