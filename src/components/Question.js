import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { useHistory } from "react-router";

const Question = forwardRef((props, ref) => {
    const history = useHistory();

    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [listView, setListView] = useState(true);

    var [editQuestion, setEditQuestion] = useState('');
    var [trueAnswer, setTrueAnswer] = useState('');
    var [falseAnswer1, setFalseAnswer1] = useState('');
    var [falseAnswer2, setFalseAnswer2] = useState('');
    var [falseAnswer3, setFalseAnswer3] = useState('');

    useEffect(() => {
        setTimeout(getQuestionList, 500);
    }, []);

    useImperativeHandle(ref, () => ({
            getQuestions(questions) {
                setQuestions(questions);
            },
            refreshQuestions() {
                getQuestionList();
            }
        })
    );

    const getQuestionList = () => {
        props.send('getquestionslist', null);
    }

    const sendQuestion = () => {
        if(currentQuestion===null || currentQuestion==='') {
            props.send('addquestion', {
                question: editQuestion,
                answers: [
                    {text: trueAnswer, correct: true},
                    {text: falseAnswer1},
                    {text: falseAnswer2},
                    {text: falseAnswer3}
                ]
            });
        } else {
            let newQ = JSON.parse(JSON.stringify(questions.find(a => a._id === currentQuestion)));
            newQ.question = editQuestion;
            let ic = newQ.answers.findIndex(a => a.correct);
            newQ.answers[ic].text = trueAnswer;
            let f = newQ.answers.filter(a => !a.correct);
            f[0].text = falseAnswer1;
            f[1].text = falseAnswer2;
            f[2].text = falseAnswer3;
            props.send('updatequestion', newQ);
        }
        setToList();
    }

    const deleteQuestion = () => {
        if(currentQuestion!==null && currentQuestion!=='') {
            props.send('deletequestion', {id: currentQuestion});
            setToList();
        }
    }

    const setToEdit = e => {
        if(e.target.id===undefined) setCurrentQuestion(null);
        else {
            console.log();
            setCurrentQuestion(e.target.id);
            setListView(false);
            let q = questions.find(a => a._id === e.target.id);
            if(!!q) {
                setEditQuestion(q.question);
                let t = q.answers.find(a => a.correct);
                setTrueAnswer(t.text);
                let f = q.answers.filter(a => !a.correct);
                setFalseAnswer1(f[0].text);
                setFalseAnswer2(f[1].text);
                setFalseAnswer3(f[2].text);
            }
        }
    }

    const setToList = () => {
        setCurrentQuestion(null);
        setEditQuestion('');
        setTrueAnswer('');
        setFalseAnswer1('');
        setFalseAnswer2('');
        setFalseAnswer3('');
        setListView(true);
    }


    const renderEdit = () => {
        return  (
            <div className="formlist">
                <label>Question</label>
                <textarea value={editQuestion} onChange={e => setEditQuestion(e.target.value)}></textarea>
                <label>True Answer</label>
                <input type="text" value={trueAnswer} onChange={e => setTrueAnswer(e.target.value)}></input>
                <label>False Answer 1</label>
                <input type="text" value={falseAnswer1} onChange={e => setFalseAnswer1(e.target.value)}></input>
                <label>False Answer 2</label>
                <input type="text" value={falseAnswer2} onChange={e => setFalseAnswer2(e.target.value)}></input>
                <label>False Answer 3</label>
                <input type="text" value={falseAnswer3} onChange={e => setFalseAnswer3(e.target.value)}></input>
                <button onClick={sendQuestion}>Submit</button>
                <button onClick={deleteQuestion}>Delete</button>
                <button onClick={setToList}>Cancel</button>
            </div>
        );
    }

    const renderList = () => {
        return (
            <div>
                <button className="btnleft" onClick={() => history.push('/home')}>{'<'}</button>
                <button className="btnright" onClick={setToEdit}>+</button>
                <ul className="questionlist">
                {questions.map(q =>
                    <li
                        onClick={setToEdit}
                        id={q._id}>
                        <div onClick={setToEdit} id={q._id}>
                            {q.question}
                        </div>
                    </li>
                )}
            </ul>
            </div>
        );
    }


    return (
        <div>
            <div className="navbar">
                <h1>Questions</h1>
            </div>
            <div className="content">
                {listView?renderList():renderEdit()}
            </div>
        </div>
    );
});

export default Question