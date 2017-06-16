import gameSettings from '../config/settings'

const BALL_BASIC_DAMAGE = gameSettings.BALL_BASIC_DAMAGE
const WIDTH = gameSettings.ARENA_WIDTH
const HEIGHT = gameSettings.ARENA_HEIGHT


export default 

class gameServer {
	
	constructor(tanks, balls, hits, previousId) {
		this.tanks = []
		this.balls = []
		this.hits = []
		this.previousId = 0
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
		this.tanks = this.tanks.filter( t => {return t.id != tankId})
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
		//Detect when ball is out of bounds
		this.balls.forEach( ball => {
			this.detectCollision(ball)
			
			if(ball.x < 0 || ball.x > WIDTH
			|| ball.y < 0 || ball.y > HEIGHT) {
				ball.out = true
			} else {
				ball.fly()
			}
		})
	}
	switchBallType (tankId, ballType) {
		this.tanks.forEach( tank => {
			if (tank.id === tankId) {
				tank.collars.currentBulletType = ballType
			}
		})
	}
	addCollar(tankId) {
		this.tanks.forEach( tank => {
			if(tank.id === tankId) {
				tank.collars.goldBulletCount ++
			}
		})
	}
	detectCollision(ball) {
		//Detect if ball collides with any tank
		this.tanks.forEach( tank => {
			if (tank.id != ball.ownerId
				&& Math.abs(tank.x - ball.x) <30
				&& Math.abs(tank.y - ball.y) < 30) {
					//Hit tank
					this.hurtTank(tank, ball.type)
					
					ball.out = true
					ball.exploding = true
					
						// write hit owner to array
						this.hits.forEach( hit => {
							if (hit.id === ball.id) {
								hit.hitOwnerId = tank.id
								
								if(tank.hp <= 0) {
									hit.isFrag = true
								}
								
								// add gold bullet to ball owner
								this.addCollar(ball.ownerId)
							}
						})
				}
		})
	}
	hurtTank (tank, ballType) {
		if (ballType == undefined || ballType.isNaN) {
			console.log('gameserver: balltype error')
			tank.hp -= BALL_BASIC_DAMAGE
		} else {
			tank.hp -= BALL_BASIC_DAMAGE * ballType // 10
		}
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
	controlCollars (ballOwnerId) {
		this.tanks.forEach(tank => {
			if (tank.id === ballOwnerId) {
				if (tank.collars.currentBulletType === 2 && tank.collars.goldBulletCount > 0) {
					tank.collars.goldBulletCount --
				}
				if (tank.collars.currentBulletType === 2 && tank.collars.goldBulletCount <= 0) {
					tank.collars.currentBulletType = 1
				}
				if (tank.collars.currentBulletType === 1) {
					tank.collars.normBulletCount --
				}
			}
		})
	}
}