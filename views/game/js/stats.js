let socket = io.connect('/', {query: "username=stats"})
let serverStatistic = []
let table = new Tablesort(document.getElementById('game-stats'));

class playerStats {
    constructor(id, name, tankname, shoots, hits, frags, accuracy){
        this.id = id
        this.name = name
        this.tankname = tankname
        this.shoots = shoots
        this.hits = hits
        this.accuracy = 100 + "%"
        this.dead = false
        this.frags = 0
    }
    calcAccuracy () {
        let accuracy = Math.floor((this.hits / this.shoots) * 100) + "%"
        
        if (accuracy.isNaN || this.hits === 0 || this.shoots === 0 ) {
            this.accuracy = 0 + "%"
        } else {
            this.accuracy = accuracy
        }
        
        return this.accuracy
    }
}

$(document).ready( () => {
    socket.on('sync', data => {
        table.refresh()
        
        data.players.forEach(player => {
            let found = false
            if(player.name !== 'stats' && player.ingame) {
            // sync data
                serverStatistic.forEach( serverPlayer => {
                    if(player.tankname === serverPlayer.tankname) {
                        serverPlayer.shoots = player.shoots
                        serverPlayer.hits   = player.hits
                        serverPlayer.dead   = player.dead
                        serverPlayer.frags  = player.frags
                        found = true
                        
                        $("#" + serverPlayer.tankname).find('#frags').text(serverPlayer.frags)
                        $("#" + serverPlayer.tankname).find('#shoots').text(serverPlayer.shoots)
                        $("#" + serverPlayer.tankname).find('#hits').text(serverPlayer.hits)
                        
                        let status = "live"
                        if (player.dead === true) {status = "dead"}
                        
                        $("#" + serverPlayer.tankname).find('#status').text(status)
                        $("#" + serverPlayer.tankname).find('#accuracy').text(serverPlayer.calcAccuracy())
                    }
                })
            }
            
            //create new object
            if (!found &&
                player.tankname !== undefined && player.ingame) {
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
                    // draw new row
                    $('#tbdata').append(
                        "<tr id="                 + p.tankname + 
                        "><td id='name'>"         + p.name + 
                        "</td><td id='tankname'>" + p.tankname + 
                        "</td><td id='frags'>"    + p.frags + 
                        "</td><td id='hits'>"     + p.hits + 
                        "</td><td id='shoots'>"   + p.shoots + 
                        "</td><td id='accuracy'>" + p.accuracy + 
                        "</td><td id='status'>"   + status  + 
                        "</td></tr>")
            }
        })

    })
})