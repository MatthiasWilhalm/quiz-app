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
    answers: [AnswerSchema]
});

const Question = mong.model('question', QuestionSchema);

module.exports = Question;