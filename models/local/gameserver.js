// local client methods

import gameSettings from '../../config/settings'
const BALL_BASIC_DAMAGE = gameSettings.BALL_BASIC_DAMAGE

module.exports = class gameServer {
	
	constructor(tanks, balls, hits, previousId) {
		this.tanks = []
		this.balls = []
		this.hits = []
		this.previousId = 1
	}
	addTank(tank) {
		this.tanks.push(tank)
	}
	addBall(ball) {
		this.balls.push(ball)
	}
	addHit(hit) {
		this.hits.push(hit)
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
	switchBulletType(tankId, bulletType) {
		this.tanks.forEach( tank => {
			if (tank.id == tankId) {
				tank.collars.currentBulletType = bulletType
			}
		})
	}
	detectCollision(ball) {
		//Detect if ball collides with any tank
		let self = this
		
		this.tanks.forEach( tank => {
			if (tank.id != ball.ownerId
				&& Math.abs(tank.x - ball.x) <30
				&& Math.abs(tank.y - ball.y) < 30) {
					//Hit tank
					self.hurtTank(tank, ball.type)
					
					ball.out = true
					ball.exploding = true
					
						// write hit owner to array
						this.hits.forEach( hit => {
							if (hit.id == ball.id) {
								hit.hitOwnerId = tank.id
								
								this.addCollar(hit.bulletOwnerId)
							}
						})
				}
		})
	}
	addCollar (tankId) {
		this.tanks.forEach( tank => {
			if (tank.id == tankId) {
				tank.collars.goldBulletCount ++
			}
		})
	}
	hurtTank (tank, ballType) {
		tank.hp -= BALL_BASIC_DAMAGE * ballType // 10
	}
	getData () {
		let gameData = {}
		gameData.tanks = this.tanks
		gameData.balls = this.balls
		gameData.hits = this.hits
		return gameData
	}
	cleanDeadTanks () {
		this.tanks = this.tanks.filter ( t => { return t.hp > 0})
	}
	cleanDeadBalls () {
		this.balls = this.balls.filter (ball => { return !ball.out})
	}
	increasePreviousId () {
		this.previousId ++
	}
}