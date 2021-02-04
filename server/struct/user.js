const mong = require('mongoose');
const Schema = mong.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
        default: ''
    },
    pwd: {
        type: String,
        default: ''
    }
});

const User = mong.model('user', UserSchema);

module.exports = User;