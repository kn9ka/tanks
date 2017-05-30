import mongoose from 'mongoose'
import bcrypt from 'bcrypt'


const userSchema = mongoose.Schema ({
    local: {
        username: String,
        password: String
    },
    google: {
        id: String,
        token: String,
        email: String,
        name: String
    }
})

userSchema.methods.generateHash = function (password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(5));
}

userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.local.password);
}

module.exports = mongoose.model('User', userSchema)