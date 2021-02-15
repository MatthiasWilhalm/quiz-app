const mong = require('mongoose');
const Schema = mong.Schema;

const PlayerInRound = new Schema({
    player: {
        type: mong.Schema.ObjectId,
        ref: 'user'
    },
    type: {
        type: String,
        enum: ['spec', 'ask']
    },
    wasRight: {
        type: Boolean,
        default: false
    }
});

const Round = new Schema({
    question: {
        type: mong.Schema.ObjectId,
        ref: 'question',
        default: null
    },
    playerInRound: [PlayerInRound]
});

const GameSchema = new Schema({
    rounds: [Round],
    state: {
        type: String,
        enum: [
            "lobby", "question", "answer", "end", "done"
        ],
        default: "lobby"
    },
    mod: {
        type: mong.Schema.ObjectId,
        ref: 'user',
        default: null
    }
});

const Game = mong.model('game', GameSchema);

module.exports = Game;