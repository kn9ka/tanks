let socket = io.connect('/', {query: "username=stats"})
let serverStatistic = []

class playerStats {
    constructor(id, name, tankname, shoots, hits, frags){
        this.id = id
        this.name = name
        this.tankname = tankname
        this.shoots = shoots
        this.hits = hits
        this.accuracy = 100 + "%"
        this.dead = false
        this.frags = 0
    }
}

$(document).ready(function () {
    socket.on('syncStats', data => {
        data.forEach(player => {
            let found = false
            if(player.name !== 'stats' && player.ingame) {
            // sync data
                serverStatistic.forEach( serverPlayer => {
                    if(player.tankname === serverPlayer.tankname) {
                        serverPlayer.shoots = player.shoots
                        serverPlayer.hits = player.hits
                        serverPlayer.dead = player.dead
                        serverPlayer.frags = player.frags
                        found = true
                        
                        $("#" + serverPlayer.tankname).find('#frags').text(serverPlayer.frags)
                        $("#" + serverPlayer.tankname).find('#shoots').text(serverPlayer.shoots)
                        $("#" + serverPlayer.tankname).find('#hits').text(serverPlayer.hits)
                        
                        let status = "live"
                        if (player.dead == true) {status = "dead"}
                        
                        $("#" + serverPlayer.tankname).find('#status').text(status)
                        
                        let accuracy = Math.floor((serverPlayer.hits / serverPlayer.shoots) * 100) + "%"
                        if (accuracy.isNaN || serverPlayer.hits == 0 || serverPlayer.shoots ==0 ) {accuracy = "0%"}
                        $("#" + serverPlayer.tankname).find('#accuracy').text(accuracy)
                    }
                })
            }
            
            //create new object
            if (player.tankname !== undefined && player.ingame && !found) {
                let p = new playerStats (
                    player.id,
                    player.name,
                    player.tankname,
                    player.shoots,
                    player.hits,
                    player.frags
                )
                serverStatistic.push(p)
                
                let status = 'live'
                $('#tbdata').append("<tr id=" + p.tankname + "><td id='name'>"  + p.name + "</td><td id='tankname'>" + p.tankname + "</td><td id='frags'>" + p.frags + "</td><td id='hits'>" + p.hits+ "</td><td id='shoots'>" + p.shoots + "</td><td id='accuracy'>" + p.accuracy + "</td><td id='status'>" + status  + "</td></tr>"); 
            }
        })

    })
})