import queryString from 'query-string';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { getUser } from '../tools/connection';

const Game = forwardRef((props, ref) => {
    const history = useHistory();

    const WINASK = 5;
    const WINSPEC = 2;

    const [game, setGame] = useState(null);
    const [player, setPlayer] = useState([]);
    const [nextPlayer, setNextPlayer] = useState('');
    const [nextQuestion, setNextQuestion] = useState('');
    const [questionView, setQuestionView] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const params = useParams();

    const QUESTIONPREFIX = ['A', 'B', 'C', 'D'];

    const getGame = () => {
        if(!params.id)
            history.push('/home');
        else
            props.send('joingame', { id: params.id });
    }

    const addRound = () => {
        props.send('addround', { player: nextPlayer, question: nextQuestion });
        setNextPlayer('');
        setNextQuestion('');
        setQuestionView(false);
    }

    const requestQuestions = () => {
        props.send('getquestions', null);
    }

    const updateRoundSelected = s => {
        props.send('updateroundselected', {roundID: getCurrentRound()._id, selected: s});
    }

    const getCurrentRound = () => {
        if (game !== null)
            return game.rounds[game.rounds.length - 1];
        return null;
    }

    const leaveGame = () => {
        props.send('leavegame', null);
        history.push('/home');
    }

    const closeGame = () => {
        props.send('closegame', null);
    }

    const updateGame = newGame => {
        console.log(newGame);
        if(game!==null && game.state === 'question' && newGame.state === 'lobby') {
            setShowResult(true);
        }

        console.log('got gameupdate');
        setGame(newGame);
        if((newGame!==null && newGame.state==='done') || (game!==null && game.state==='done')) {
            leaveGame();
        }
    }

    const closeResoltWindow = () => {
        setShowResult(false);
    }

    useImperativeHandle(ref, () => ({
        loadGame(newGame) {
            updateGame(newGame);
        },
        updatePlayerList(playerlist) {
            setPlayer(playerlist);
        },
        getQuestions(questions) {
            setQuestions(questions);
        },
        goLogin() {
            history.push('/login');
        }
    }));

    useEffect(() => {
        //TODO wait until ws has been connected
        setTimeout(getGame, 500);
        setQuestionView(false);
    }, []);

    const isMod = () => {
        return game !== null && game.mod === getUser().id;
    }

    const isSpec = () => {
        let player = getCurrentRound().playerInRound.find(a => a.player === getUser().id);
        return !!player && !isMod() && !player.ask;
    }

    const isAsk = () => {
        let player = getCurrentRound().playerInRound.find(a => a.player === getUser().id);
        return !!player && !isMod() && player.ask;
    }

    const selectPlayerToAsk = e => {
        if (isMod()) {
            if (e.target.id === nextPlayer)
                setNextPlayer('');
            else if (getUser().id !== e.target.id)
                setNextPlayer(e.target.id);
        }
    }

    const selectNextQuestion = e => {
        if (e.target.id === nextQuestion)
            setNextQuestion('');
        else
            setNextQuestion(e.target.id);
    }

    const isSelectedAnswer = i => {
        return getCurrentRound().playerInRound.find(a => a.ask).selected === i;
    }

    const isSpecSelected = i => {
        return getCurrentRound().playerInRound.find(a => a.player === getUser().id).selected === i;
    }

    const isQuestionAlreadyAsked = questionID => {
        return game.rounds.findIndex(a => {
            return a.question._id+'' === questionID+'';
        }) !== -1;
    }

    const endRound = () => {
        props.send('endround', null);
    }

    const toggleQuestionView = () => {
        setQuestionView(!questionView);
        if (!questionView)
            requestQuestions();
    }

    const renderState = () => {
        if (game === null || game.state === 'lobby')
            return renderLobby();
        else if (game.state === 'question') {
            return (
                <div>
                    {renderQuestion()}
                    {isSpec()?renderSpecButtons():''}
                </div>
                );
        }
            
    }

    const getPoints = id => {
        let ret = 0;
        if (game !== null) {
            game.rounds.forEach(r => {
                let p = r.playerInRound.find(pr => pr.player === id);
                if (!!p) {
                    if (p.ask && p.selected === 0) ret += WINASK;
                    else {
                        let pw = r.playerInRound.find(pr => pr.ask);
                        if (!!pw && ((pw.selected === 0 && p.selected === 1) ||
                            (pw.selected > 0 && p.selected === 0))) {
                            ret += WINSPEC;
                        }
                    }
                }
            });
        }
        return ret;
    }

    const isCorrect = () => {
        if(game.rounds.length>0) {
            const pir = game.rounds[game.rounds.length-1].playerInRound.find(p => p.player === getUser().id);
            if(pir.ask) {
                return pir.selected === 0;
            } else {
                const ask = game.rounds[game.rounds.length-1].playerInRound.find(p => p.ask)?.selected;
                return (pir.selected === 1 && ask === 0) || (pir.selected === 0 && ask > 1);
            }
        }
    }

    const renderResultWindow = () => {
        if(isAsk()) {
            return (
                <div className="resultwindow">
                    {isCorrect()?'Noice':'To Bad'}
                    <button onClick={closeResoltWindow}>close</button>
                </div>
            );
        } else if(isSpec()) {
            return (
                <div className="resultwindow">
                    {isCorrect()?'U guessed right':'U didn\'t guessed right'}
                    <button onClick={closeResoltWindow}>close</button>
                </div>
            );
        } else if(isMod()) {
            return (
                <div className="resultwindow">
                    what ever
                    <button onClick={closeResoltWindow}>close</button>
                </div>
            );
        }

    }

    const renderLobby = () => {
        return (
            <div>
                <div className="mainbuttons buttonarray">
                    {isMod()?<button onClick={closeGame}>close Game</button>:''}
                    <button onClick={leaveGame}>leave Game</button>
                    <button onClick={getGame}>reload</button>
                    {isMod() ? <button onClick={toggleQuestionView}>Select question</button> : ''}
                    {isMod() && nextPlayer !== '' && nextQuestion !== '' ? <button onClick={addRound}>Start game</button> : ''}
                </div>
                {questionView ?
                    <ul className="questionlist">
                        {questions.map(q =>
                            <li
                                className={(q._id === nextQuestion ? 'selected ' : '')+(isQuestionAlreadyAsked(q._id)?'graytext':'')}
                                onClick={selectNextQuestion}
                                id={q._id}>
                                <div onClick={selectNextQuestion} id={q._id}>{q.question}</div>
                            </li>
                        )}
                    </ul> :
                    <ul className="playerlist">
                        {player.map(p =>
                            <li
                                onClick={selectPlayerToAsk}
                                id={p.id}
                                className={p.id === nextPlayer ? 'selected' : ''}>
                                <div onClick={selectPlayerToAsk} id={p.id}>{p.name}</div>
                                <div onClick={selectPlayerToAsk} id={p.id}>{(game !== null && p.id === game.mod ? 'mod' : getPoints(p.id))}</div>

                            </li>)
                        }
                    </ul>}
            </div>
        );
    }

    const renderQuestion = () => {
        let round = getCurrentRound();
        if (round !== null)
            return (
                <div>
                    <div className="mainbuttons buttonarray">
                        {isMod()?<button onClick={endRound}>end Round</button>:''}
                    </div>
                    <div className="questionfield">{round.question.question}</div>
                    <div className="answersbuttons">
                        {round.order.map((a, i) => 
                            <button 
                                disabled={!isAsk()}
                                onClick={() => updateRoundSelected(a)}
                                className={isSelectedAnswer(a)?'selected':''}>
                                <div>{QUESTIONPREFIX[i]+")"}</div>
                                <div>{round.question.answers[a].text}</div>
                            </button>
                        )}
                    </div>
                </div>
            );
        return null;
    }

    const renderSpecButtons = () => {
        return (
            <div>
                <button className={(isSpecSelected(1)? "selected":"true")} onClick={() => updateRoundSelected(1)}>true</button>
                <button className={(isSpecSelected(0)? "selected":"false")} onClick={() => updateRoundSelected(0)}>false</button>
            </div>
        );
    }

    return (
        <div>
            <h1>Game</h1>
            {showResult?renderResultWindow():''}
            {renderState()}

        </div>
    );
});

export default Game