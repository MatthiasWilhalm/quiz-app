const mong = require('mongoose');
const Schema = mong.Schema;

const PlayerInRound = new Schema({
    player: {
        type: mong.Schema.ObjectId,
        ref: 'user'
    },
    ask: {
        type: Boolean,
        default: false
    },
    selected: { //spec: 0 = false; 1 = true // ask: answers 0-3 //-1 nothing selected
        type: Number,
        default: -1
    }
});

const Round = new Schema({
    question: {
        type: mong.Schema.ObjectId,
        ref: 'question',
        default: null
    },
    order: [{
        type: Number
    }],
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