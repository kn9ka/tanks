let WIDTH = 800
let HEIGHT = 500 
let socket = io.connect()
let game = new Arena('#arena', WIDTH, HEIGHT, socket)
let selectedTank = 1
let tankName = ''

socket.on('addTank', (tank) => {
	game.addTank(tank.id, tank.type, tank.isLocal, tank.x, tank.y)
})

socket.on('sync', (gameServerData) => {
	game.receiveData(gameServerData)
})

socket.on('killTank', (tankData) => {
	game.killTank(tankData)
})

socket.on('removeTank', (tankId) => {
	game.removeTank(tankId)
})

$(document).ready( () => {

	$('#join').click( () => {
		tankName = $('#tank-name').val()
		joinGame(tankName, selectedTank, socket)
	})
	
	$('#tank-name').keyup( (e) => {
		tankName = $('#tank-name').val()
		let k = e.keyCode || e.which
		if(k == 13){
			joinGame(tankName, selectedTank, socket)
		}
	})
	// исправить function на => когда это пофиксится
	$('ul.tank-selection li').click( function (){
		$('.tank-selection li').removeClass('selected')
		$(this).addClass('selected')
		selectedTank = $(this).data('tank')
	});

	$('ul.bullet-selection li').click( function (){
		$('.bullet-selection li').removeClass('selected')
		$(this).addClass('selected')
		selectedBullet = $(this).data('bullet')
		socket.emit('bulletChange', selectedBullet)
	})
	
})

$(window).on('beforeunload', function() {
	console.log('unload')
	socket.emit('leaveGame', tankName)
})

joinGame = (tankName, tankType, socket) => {
	if(tankName != '') {
		$('#prompt').hide()
		$('#headbar').hide()
		socket.emit('joinGame', {id: tankName, type: tankType})
	}
}