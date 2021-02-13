const mong = require('mongoose');
const Schema = mong.Schema;

const Points = new Schema({
    player: {
        type: mong.Schema.ObjectId,
        ref: 'user'
    },
    points: {
        type: Number,
        default: 0
    }
});

const Round = new Schema({
    question: {
        type: mong.Schema.ObjectId,
        ref: 'question',
        default: null
    },
    playerpoints: [Points]
});

const GameSchema = new Schema({
    rounds: [Round],
    state: {
        type: String,
        enum: [
            "lobby", "question", "answer", "end", "done"
        ],
        default: "lobby"
    }
});

const Game = mong.model('game', GameSchema);

module.exports = Game;