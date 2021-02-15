const mong = require('mongoose');
const User = require('./struct/user.js');

const bcrypt = require('bcrypt');
const Game = require('./struct/game.js');
const saltRounds = 10;

mong.connect(
    "mongodb://localhost:27017/quiz",
    { useNewUrlParser: true, useUnifiedTopology: true }
);
//'mongodb://Admin:123456@localhost:27017/testdb?authSource=admin'

mong.connection.once('open', () => {
    console.log('Connected to mongo-db');
});

mong.connection.on('error', error => {
    console.log(error);
});

module.exports = {

    login: function (name, pwd) {
        return new Promise(resolve => {
            User.findOne({ name: name }).exec((err, data) => {
                if (err) resolve(-2);
                else if (data !== null) {
                    bcrypt.compare(pwd, data.pwd, function (err, result) {
                        if (err) resolve(-2);
                        else if (!result) resolve(-1);
                        else resolve(data);
                    });
                } else {
                    resolve(-1);
                }
            });
        });
    },

    createGame: function (modId) {
        return new Promise(resolve => {
            let game = new Game();
            game.mod = modId;
            game.save((err, data) => {
                if(err) resolve(-1);
                else resolve(data);
            });
        });
    },

    getGame: function(id) {
        return new Promise(resolve => {
            Game.findOne({_id: id})
            .populate('rounds')
            .populate('rounds.playerpoints')
            .exec((err, data) => {
                if(err) resolve(-1);
                else resolve(data);
            });
        });
    },
    
    openRound: function(gameID, player) {
        return new Promise(resolve => {
            Game.findOne({_id: gameID}).exec((err, game) => {
                if(err) resolve(-1);
                else {
                    game.rounds.push(new ); //TODO runden erstellen
                }
            });
        });
    },


    /**
     * debug only!!!
     */
    addExUser: function () {
        console.log("add");
        return new Promise(resolve => {
            bcrypt.hash('123456', saltRounds, function (err, hash) {
                let u = new User({ name: 'Emma', pwd: hash });
                u.save((err, data) => {
                    if (err) resolve(-1);
                    else resolve(0);
                });
            });
        });
    }
}