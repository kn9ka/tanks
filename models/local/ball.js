import gameSettings from '../../config/settings'

module.exports = class Ball {
    
        constructor (lastBallId, ownerId, alpha, x, y, type) {
        this.id = lastBallId
        this.ownerId = ownerId
        this.alpha = alpha // angle of shot in radians
        this.x = x
        this.y = y
        this.out = false
        this.ballSpeed = gameSettings.BALL_SPEED // 10
        this.type = type
    }
    
    fly () {
        //move to trayectory
        let speedX =  this.ballSpeed * Math.sin(this.alpha)
        let speedY = -this.ballSpeed * Math.cos(this.alpha)
        this.x += speedX
        this.y += speedY
    }
}