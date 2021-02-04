const mong = require('mongoose');
const Schema = mong.Schema;

const QuestionSchema = new Schema({
    question: {
        type: String,
        default: ''
    },
    response: {
        type: String,
        default: ''
    }
});

const Question = mong.model('question', QuestionSchema);

module.exports = Question;