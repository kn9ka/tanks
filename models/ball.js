let BALL_SPEED = 10

class Ball {
    
    constructor (lastBallId, ownerId, alpha, x, y) {
        this.id = lastBallId
        this.ownerId = ownerId
        this.alpha = alpha // angle of shot in radians
        this.x = x
        this.y = y
        this.out = false
    }
    
    fly () {
        //move to trayectory
        let speedX =  BALL_SPEED * Math.sin(this.alpha)
        let speedY = -BALL_SPEED * Math.cos(this.alpha)
        this.x += speedX
        this.y += speedY
    }
}

module.exports = Ball