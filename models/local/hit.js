module.exports = class Hit {
    constructor (hitId, bulletOwnerId, username) {
        this.id = hitId // номер выстрела
        this.bulletOwnerId = bulletOwnerId // кто стрелял
        this.hitOwnerId = [] // в кого попали
        this.username = username
    }
}