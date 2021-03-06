const mong = require('mongoose');
const Schema = mong.Schema;

const AnswerSchema = new Schema({
    text: {
        type: String,
        default: ''
    },
    correct: {
        type: Boolean,
        default: false
    }
});

const QuestionSchema = new Schema({
    question: {
        type: String,
        default: ''
    },
    fileurl: {
        type: String,
        default: ''
    },
    filetype: {
        type: String,
        enum: [
            'img',
            'iframe',
            'video',
            'audio'
        ],
        default: 'img'
    },
    answers: [AnswerSchema]
});

const Question = mong.model('question', QuestionSchema);

module.exports = Question;