let DEBUG = true
let INTERVAL = 50
let ROTATION_SPEED = 5
let ARENA_MARGIN = 30

class Arena {
	
	constructor (arenaId, w, h, socket) {
		this.tanks = [] //Tanks (other than the local tank)
		this.balls = []
		this.hits = []
		this.width = w
		this.height = h
		this.$arena = $(arenaId)
		this.$arena.css('width', w)
		this.$arena.css('height', h)
		this.$arenaStats = $('#arena-stats')
		this.$arenaStats.css('width', w)
		this.$arenaStats.css('height', h)
		this.socket = socket
		setInterval( () =>  {this.mainLoop()}, INTERVAL)
	}
	addTank (id, type, isLocal, x, y, hp, collars) {
		let t = new Tank(id, type, this.$arena, this, isLocal, x, y, hp, collars)
		if(isLocal){
			this.localTank = t
		} else {
			this.tanks.push(t)
		}
	}
	addHit (ball) {
		this.hits.push(ball)
	}
	removeTank (tankId) {
		//Remove tank object
		this.tanks = this.tanks.filter( (t) => {return t.id != tankId} )
		//remove tank from dom
		$('#' + tankId).remove()
		$('#info-' + tankId).remove()
		
	}
	killTank (tank) {
		tank.dead = true
		this.removeTank(tank.id)
		//place explosion
		this.$arena.append('<img id="expl' + tank.id + '" class="explosion" src="./img/explosion.gif">')
		$('#expl' + tank.id).css('left', (tank.x - 50)  + 'px')
		$('#expl' + tank.id).css('top', (tank.y - 100)  + 'px')

		setTimeout( () => {
			$('#expl' + tank.id).remove()
		}, 300)
	}
	mainLoop () {
		if(this.localTank != undefined){
		//send data to server about local tank
		this.sendData()
		//move local tank
		this.localTank.move()
		}
	}
	sendData () {
		//Send local data to server
		let gameData = {}

		//Send tank data
		let t = {
			id: this.localTank.id,
			x: this.localTank.x,
			y: this.localTank.y,
			baseAngle: this.localTank.baseAngle,
			cannonAngle: this.localTank.cannonAngle,
		}
		gameData.tank = t
		//Client game does not send any info about balls,
		//the server controls that part
		this.socket.emit('sync', gameData)
	}
	receiveData (serverData) {
		let game = this
		console.log(serverData)
		serverData.tanks.forEach( (serverTank) => {
			
			//Update local tank stats
			if(game.localTank !== undefined && serverTank.id == game.localTank.id){
				game.localTank.hp = serverTank.hp
				game.localTank.collars = serverTank.collars

				if(game.localTank.hp <= 0){
					game.killTank(game.localTank)
					this.socket.emit('gameover', game.localTank.id)
				}
			}

			//Update foreign tanks
			let found = false
			game.tanks.forEach( (clientTank) => {
				//update foreign tanks
				if(clientTank.id == serverTank.id){
					clientTank.x = serverTank.x
					clientTank.y = serverTank.y
					clientTank.baseAngle = serverTank.baseAngle
					clientTank.cannonAngle = serverTank.cannonAngle
					clientTank.hp = serverTank.hp
					clientTank.collars = serverTank.collars

					if(clientTank.hp <= 0){
						game.killTank(clientTank)
					}
					
					clientTank.refresh()
					found = true
				}
			})
			if(!found &&
				(game.localTank == undefined || serverTank.id != game.localTank.id)){
				//I need to create it
				game.addTank(serverTank.id, serverTank.type, false, serverTank.x, serverTank.y, serverTank.hp, serverTank.collars)
			}
		})

		//Render balls
		
		game.$arena.find('.cannon-ball').remove()
		game.$arena.find('.cannon-ball-gold').remove()
		
		serverData.balls.forEach( (serverBall) => {
			let b = new Ball(serverBall.id, serverBall.ownerId, game.$arena, serverBall.x, serverBall.y, serverBall.type)
			b.exploding = serverBall.exploding
			if(b.exploding){
				b.explode()
			}
		})
		
		
	}
}

class Ball {
	
	constructor (id, ownerId, $arena, x, y, type) {
		this.id = id
		this.ownerId = ownerId
		this.$arena = $arena
		this.x = x
		this.y = y
		this.type = type
		
		this.materialize()
	}
	materialize () {
		
		var divClass = 'cannon-ball'
		
		if(this.type == 1) {
			divClass = 'cannon-ball'
		}
		if(this.type == 2) {
			divClass ='cannon-ball-gold'
		}
		
		this.$arena.append('<div id="' + this.id + '" class="' + divClass + '" style="left:' + this.x + 'px"></div>')
		this.$body = $('#' + this.id)
		this.$body.css('left', this.x + 'px')
		this.$body.css('top',  this.y + 'px')
	}
	explode () {
		this.$arena.append('<div id="expl' + this.id + '" class="ball-explosion" style="left:' + this.x + 'px"></div>')
		let $expl = $('#expl' + this.id)
		$expl.css('left', this.x + 'px')
		$expl.css('top', this.y + 'px')
		setTimeout( () => {
			$expl.addClass('expand')
		}, 1)
		setTimeout( () => {
			$expl.remove()
		}, 1000)
	}
}

class Tank {
	
	constructor (id, type, $arena, game, isLocal, x, y, hp, collars) {
		this.id = id
		this.type = type
		this.speed = 5
		this.$arena = $arena
		this.w = 60
		this.h = 80
		this.baseAngle = getRandomInt(0, 360)
		//Make multiple of rotation amount
		this.baseAngle -= (this.baseAngle % ROTATION_SPEED)
		this.cannonAngle = 0
		this.x = x
		this.y = y
		this.mx = null
		this.my = null
		this.dir = {
			up: false,
			down: false,
			left: false,
			right: false
		}
		this.game = game
		this.isLocal = isLocal
		this.hp = hp
		this.dead = false
		this.collars = collars

		this.materialize()
	}
	materialize () {
		this.$arena.append('<div id="' + this.id + '" class="tank tank' + this.type + '"></div>')
		this.$body = $('#' + this.id)
		this.$body.css('width', this.w)
		this.$body.css('height', this.h)

		this.$body.css('-webkit-transform', 'rotateZ(' + this.baseAngle + 'deg)')
		this.$body.css('-moz-transform', 'rotateZ(' + this.baseAngle + 'deg)')
		this.$body.css('-o-transform', 'rotateZ(' + this.baseAngle + 'deg)')
		this.$body.css('transform', 'rotateZ(' + this.baseAngle + 'deg)')

		this.$body.append('<div id="cannon-' + this.id + '" class="tank-cannon"></div>')
		this.$cannon = $('#cannon-' + this.id)

		this.$arena.append('<div id="info-' + this.id + '" class="info"></div>')
		this.$info = $('#info-' + this.id)
		this.$info.append('<div class="label">' + this.id + '</div>')
		this.$info.append('<div class="hp-bar"></div>')
		this.$info.append('<div class="ball-count">' + this.collars.goldBulletCount + '</div>')

		this.refresh()

		if(this.isLocal){
			this.setControls()
		}
	}
	isMoving () {
		return this.dir.up || this.dir.down || this.dir.left || this.dir.right
	}
	refresh () {
		this.$body.css('left', this.x - 30 + 'px')
		this.$body.css('top', this.y - 40 + 'px')
		this.$body.css('-webkit-transform', 'rotateZ(' + this.baseAngle + 'deg)')
		this.$body.css('-moz-transform', 'rotateZ(' + this.baseAngle + 'deg)')
		this.$body.css('-o-transform', 'rotateZ(' + this.baseAngle + 'deg)')
		this.$body.css('transform', 'rotateZ(' + this.baseAngle + 'deg)')

		let cannonAbsAngle = this.cannonAngle - this.baseAngle
		this.$cannon.css('-webkit-transform', 'rotateZ(' + cannonAbsAngle + 'deg)')
		this.$cannon.css('-moz-transform', 'rotateZ(' + cannonAbsAngle + 'deg)')
		this.$cannon.css('-o-transform', 'rotateZ(' + cannonAbsAngle + 'deg)')
		this.$cannon.css('transform', 'rotateZ(' + cannonAbsAngle + 'deg)')

		this.$info.css('left', (this.x) + 'px')
		this.$info.css('top', (this.y) + 'px')
		
		if(this.isMoving()){
			this.$info.addClass('fade')
		} else {
			this.$info.removeClass('fade')
		}

		this.$info.find('.hp-bar').css('width', this.hp + 'px')
		this.$info.find('.hp-bar').css('background-color', getGreenToRed(this.hp))
		this.$info.find('.ball-count').text(this.collars.goldBulletCount)
		
	}
	setControls () {
		let t = this

		/* Detect both keypress and keyup to allow multiple keys
		 and combined directions */
		$(document)
		.keypress( (e) => {
			let k = e.keyCode || e.which
			switch(k){
				case 119: //W
					t.dir.up = true
					break
				case 100: //D
					t.dir.right = true
					break
				case 115: //S
					t.dir.down = true
					break
				case 97: //A
					t.dir.left = true
					break
			}
		})
		.keyup( (e) => {
			let k = e.keyCode || e.which
			switch(k){
				case 87: //W
					t.dir.up = false
					break
				case 68: //D
					t.dir.right = false
					break
				case 83: //S
					t.dir.down = false
					break
				case 65: //A
					t.dir.left = false
					break
			}
		})
		.mousemove( (e) => { //Detect mouse for aiming
			t.mx = e.pageX - t.$arena.offset().left
			t.my = e.pageY - t.$arena.offset().top
			t.setCannonAngle()
		})
		.click( () => {
			t.shoot()
		})
	}
	move () {
		if(this.dead){
			return
		}

		let moveX = 0
		let moveY = 0

		if (this.dir.up) {
			moveY = -1
		} else if (this.dir.down) {
			moveY = 1
		}
		if (this.dir.left) {
			moveX = -1
		} else if (this.dir.right) {
			moveX = 1
		}

		moveX = this.speed * moveX
		moveY = this.speed * moveY

		if(this.x + moveX > (0 + ARENA_MARGIN) && (this.x + moveX) < (this.$arena.width() - ARENA_MARGIN)){
			this.x += moveX
		}
		if(this.y + moveY > (0 + ARENA_MARGIN) && (this.y + moveY) < (this.$arena.height() - ARENA_MARGIN)){
			this.y += moveY
		}
		this.rotateBase()
		this.setCannonAngle()
		this.refresh()
	}
	rotateBase () {
		if((this.dir.up && this.dir.left)
			|| (this.dir.down && this.dir.right)){ //diagonal "left"
			this.setDiagonalLeft()
		}else if((this.dir.up && this.dir.right)
			|| (this.dir.down && this.dir.left)){ //diagonal "right"
			this.setDiagonalRight()
		}else if(this.dir.up || this.dir.down){ //vertical
			this.setVertical()
		}else if(this.dir.left || this.dir.right){  //horizontal
			this.setHorizontal()
		}
	}
	setVertical () {
		let a = this.baseAngle
		if(a != 0 && a != 180){
			if(a < 90 || (a > 180 && a < 270)){
				this.decreaseBaseRotation()
			}else{
				this.increaseBaseRotation()
			}
		}
	}
	setHorizontal () {
		let a = this.baseAngle
		if(a != 90 && a != 270){
			if(a < 90 || (a > 180 && a < 270)){
				this.increaseBaseRotation()
			}else{
				this.decreaseBaseRotation()
			}
		}
	}
	setDiagonalLeft () {
		let a = this.baseAngle
		if(a != 135 && a != 315){
			if(a < 135 || (a > 225 && a < 315)){
				this.increaseBaseRotation()
			}else{
				this.decreaseBaseRotation()
			}
		}
	}
	setDiagonalRight () {
		let a = this.baseAngle
		if(a != 45 && a != 225){
			if(a < 45 || (a > 135 && a < 225)){
				this.increaseBaseRotation()
			}else{
				this.decreaseBaseRotation()
			}
		}
	}
	increaseBaseRotation () {
		this.baseAngle += ROTATION_SPEED
		if(this.baseAngle >= 360){
			this.baseAngle = 0
		}
	}
	decreaseBaseRotation () {
		this.baseAngle -= ROTATION_SPEED
		if(this.baseAngle < 0){
			this.baseAngle = 0
		}
	}
	setCannonAngle () {
		let tank = { x: this.x , y: this.y}
		let deltaX = this.mx - tank.x
		let deltaY = this.my - tank.y
		this.cannonAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
		this.cannonAngle += 90
	}
	shoot () {
		if (this.dead) {
			// window.location.href = '/test'
			return
		}

		//Emit ball to server
		let serverBall = {}
		//Just for local balls who have owner
		
		serverBall.alpha = this.cannonAngle * Math.PI / 180 //angle of shot in radians
		//Set init position
		let cannonLength = 60
		let deltaX = cannonLength * Math.sin(serverBall.alpha)
		let deltaY = cannonLength * Math.cos(serverBall.alpha)
		
		serverBall.ownerId = this.id
		serverBall.x = this.x + deltaX - 5
		serverBall.y = this.y - deltaY - 5
		serverBall.type = this.collars.currentBulletType
		
		this.game.socket.emit('shoot', serverBall)
	}
}

function debug(msg){
	if(DEBUG){
		console.log(msg)
	}
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min
}

function getGreenToRed(percent){
	r = percent<50 ? 255 : Math.floor(255-(percent*2-100)*255/100)
	g = percent>50 ? 255 : Math.floor((percent*2)*255/100)
	return 'rgb('+r+','+g+',0)'
}