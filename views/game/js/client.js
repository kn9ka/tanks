let username = $('#username').text()
let WIDTH = 1100
let HEIGHT = 500
let socket = io.connect('/', {query: "username=" + username})
let game = new Arena('#arena', WIDTH, HEIGHT, socket)
let selectedTank = 1
let tankName = ''

socket
	.on('addTank', tank => {
		game.addTank(tank.id, tank.type, tank.isLocal, tank.x, tank.y, tank.hp, tank.collars)
	})
	.on('sync', gameServerData => {
		game.receiveData(gameServerData)
	})
	.on('removeTank', tankId => {
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
		if (k == 13) {
			joinGame (tankName, selectedTank, socket)
		}
	})
	// ?????
	$('ul.tank-selection li').click( function () {
		$('.tank-selection li').removeClass('selected')
		$(this).addClass('selected')
		selectedTank = $(this).data('tank')
	});
	
})

joinGame = (tankName, tankType, socket) => {
	if(tankName != '' || tankName != ' ') {
		$('#prompt').hide()
		socket.emit('joinGame', {id: tankName, type: tankType})
	}
}