import gameSettings from '../config/settings'

export default

class Ball {
    
        constructor (previousId, ownerId, alpha, x, y, type) {
        this.id = previousId
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