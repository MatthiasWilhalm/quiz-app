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
        console.log(s);
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

    useImperativeHandle(ref, () => ({
        loadGame(game) {
            console.log(game);
            setGame(game);
        },
        updatePlayerList(playerlist) {
            setPlayer(playerlist);
            console.log(playerlist);
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
        console.log(e.target.id);
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

    const renderLobby = () => {
        return (
            <div>
                <div className="buttonarray">
                    <button onClick={leaveGame}>leave Game</button>
                    <button onClick={getGame}>reload</button>
                    {isMod() ? <button onClick={toggleQuestionView}>Select question</button> : ''}
                    {isMod() && nextPlayer !== '' && nextQuestion !== '' ? <button onClick={addRound}>Start game</button> : ''}
                </div>
                {questionView ?
                    <ul className="questionlist">
                        {questions.map(q =>
                            <li
                                className={q._id === nextQuestion ? 'selected' : ''}
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
                                <div onClick={selectPlayerToAsk} id={p.id}>{(game !== null && p.id === game.mod ? ' -mod' : getPoints(p.id))}</div>

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
                    <div className="buttonarray">
                        {isMod()?<button onClick={endRound}>end Round</button>:''}
                    </div>
                    <div className="questionfield">{round.question.question}</div>
                    <div className="answersbuttons">
                        {round.order.map((a, i) => 
                            <button disabled={!isAsk()} onClick={() => updateRoundSelected(a)} className={isSelectedAnswer(a)?'selected':''}>
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
            {renderState()}

        </div>
    );
});

export default Game