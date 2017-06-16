export default

class Hit {
    constructor (hitId, bulletOwnerId, username) {
        this.id = hitId // номер выстрела
        this.bulletOwnerId = bulletOwnerId // кто стрелял
        this.isFrag = false
    }
}