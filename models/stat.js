import mongoose from 'mongoose'

const statsSchema = mongoose.Schema ({
    user: String,
    hits: Number,
    shoots: Number
})

module.exports = mongoose.model('playerstats', statsSchema)