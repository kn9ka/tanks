export default

class Hit {
    constructor (hitId, bulletOwnerId) {
        this.id = hitId // номер выстрела
        this.bulletOwnerId = bulletOwnerId // кто стрелял
        this.isFrag = false
    }
}