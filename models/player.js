export default 

class Player {
    constructor(id, name, tankname, hits, shoots, accuracy, frags) {
        this.id = id
        this.name = name
        this.tankname = ''
        this.hits = 0
        this.shoots = 0
        this.frags = 0
        this.accuracy = 0
        this.dead = false
        this.ingame = false
    }
}