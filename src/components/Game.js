import queryString from 'query-string';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { getUser } from '../tools/connection';

import logo from '../assets/temp_logo.png';
import coin from '../assets/coin.png';
import rounds from '../assets/rounds.png';
import mod from '../assets/mod.png';
import fficon from '../assets/fiftyfifty.png'

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
        if (!params.id)
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
        props.send('updateroundselected', { roundID: getCurrentRound()._id, selected: s });
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
        if (game !== null && game.state === 'question' && newGame.state === 'lobby') {
            setShowResult(true);
        }

        console.log('got gameupdate');
        setGame(newGame);
        if ((newGame !== null && newGame.state === 'done') || (game !== null && game.state === 'done')) {
            leaveGame();
        }
    }

    const closeResultWindow = () => {
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
            return a.question._id + '' === questionID + '';
        }) !== -1;
    }

    const endRound = () => {
        props.send('endround', null);
    }

    /**
     * 
     * @param {InputEvent} e 
     */
    const requestJoker = e => {
        props.send('setjoker', {roundId: getCurrentRound()._id, jokertype: e.target.id});
    }

    const hasJokerBeenUsed = (name, userId) => {
        let ret = false;
        let currentAsk = userId || getCurrentRound().playerInRound.find(a => a.ask)?.player;
        if(!!currentAsk) {
            game.rounds.forEach(r => {
                if(r.jokertype===name) {
                    ret = ret || r.playerInRound.find(a => a.player+'' === currentAsk+'' && a.ask);
                }
            });
        }
        return ret;
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
                    {isSpec() ? renderSpecButtons() : ''}
                </div>
            );
        }

    }

    const getTimesPlayed = playerId => {
        let ret = 0;
        if (game !== null) {
            game.rounds.forEach(r => {
                let p = r.playerInRound.find(pr => pr.player === playerId);
                if (!!p && p.ask)
                    ret++;
            });
        }
        return ret;
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
        if (game.rounds.length > 0) {
            const pir = game.rounds[game.rounds.length - 1].playerInRound.find(p => p.player === getUser().id);
            if (pir.ask) {
                return pir.selected === 0;
            } else {
                const ask = game.rounds[game.rounds.length - 1].playerInRound.find(p => p.ask)?.selected;
                return (pir.selected === 1 && ask === 0) || (pir.selected === 0 && ask >= 1);
            }
        }
    }

    const getPlayer = () => {
        let ret = [];
        if (player !== null && game !== null) {
            ret = player.filter(a => a.id + "" !== game.mod + "");
            ret.map(a => {
                a.points = getPoints(a.id);
                a.rounds = getTimesPlayed(a.id);
            });
            ret.sort((a, b) => b.points - a.points);
        }
        return ret;
    }

    const getSpecs = () => {
        let ret = [];
        getCurrentRound().playerInRound.forEach(a => {
            if(!a.ask && game.mod+"" !== a.player+"") {
                let spec = {};
                spec.id = a.id;
                let p = player.find(b => b.id+"" === a.player+"");
                if(!!p) spec.name = p.name;
                spec.selected = a.selected;
                ret.push(spec);
            }

        });
        return ret;
    }

    const getPlayerToAsk = () => {
        let pl = getCurrentRound().playerInRound.find(a => a.ask);
        let ret = {};
        ret.id = pl.id;
        let p = player.find(b => b.id+"" === pl.player+"");
        if(!!p) {
            ret.name = p.name;
            ret.selected = p.selected;
        } 
        return ret;
    }

    const getMod = () => {
        let ret = null;
        if (player !== null && game !== null) {
            ret = player.find(a => a.id + "" === game.mod + "");
        }
        return ret;
    }

    const getCorrectAnswer = round => {
        console.log(round);
        return round?.question.answers.find(a => a.correct);
    }


    const hasFile = round => {
        return round.question.fileurl!=='' && !!round.question.fileurl;
    }

    const renderFile = round => {
        if(hasFile(round)) {
            switch (round.question.filetype) {
                case 'img':
                    return (
                        <div className="questionfile">
                            <img src={round.question.fileurl}></img>
                        </div>
                    );
                case 'audio':
                    return (
                        <div className="questionfile">
                            <audio src={round.question.fileurl} controls></audio>
                        </div>
                    );
                case 'video':
                    return (
                        <div className="questionfile">
                            <video src={round.question.fileurl} controls></video>
                        </div>
                    );
                case 'iframe':
                    return (
                        <div className="questionfile">
                            <iframe 
                                width="500"
                                height="300"
                                src={round.question.fileurl}
                                frameborder="0"
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen>
                            </iframe>
                        </div>
                    );
                default:
                    return null;
            }
        } else return null;
    }

    const renderResultWindow = () => {
        if (isAsk()) {
            return (
                <div className="windowbg">
                    <div className="resultwindow">
                        <h1>{isCorrect() ? 'Noice' : 'To Bad'}</h1>
                        <p>Right Answer:</p>
                        <p>{getCorrectAnswer(getCurrentRound())?.text}</p>
                        <button onClick={closeResultWindow}>close</button>
                    </div>
                </div>
            );
        } else if (isSpec()) {
            return (
                <div className="windowbg">
                    <div className="resultwindow">
                        <h1>{isCorrect() ? 'U guessed right' : 'U didn\'t guessed right'}</h1>
                        <p>Right Answer:</p>
                        <p>{getCorrectAnswer(getCurrentRound())?.text}</p>
                        <button onClick={closeResultWindow}>close</button>
                    </div>
                </div>
            );
        } else if (isMod()) {
            return (
                <div className="windowbg">
                    <div className="resultwindow">
                        <h1>Round ended</h1>
                        <p>Right Answer:</p>
                        <p>{getCorrectAnswer(getCurrentRound())?.text}</p>
                        <button onClick={closeResultWindow}>close</button>
                    </div>
                </div>
            );
        }

    }

    const renderLobby = () => {
        return (
            <div>
                <div className="mainbuttons buttonarray">
                    {isMod() ? <button onClick={toggleQuestionView}>Select question</button> : ''}
                    {isMod() && nextPlayer !== '' && nextQuestion !== '' ? <button onClick={addRound}>Start game</button> : ''}
                </div>
                {questionView ?
                    <ul className="questionlist">
                        {questions.map(q =>
                            <li
                                className={(q._id === nextQuestion ? 'selected ' : '') + (isQuestionAlreadyAsked(q._id) ? 'graytext' : '')}
                                onClick={selectNextQuestion}
                                id={q._id}>
                                <div onClick={selectNextQuestion} id={q._id}>{q.question}</div>
                            </li>
                        )}
                    </ul> :
                    <ul className="playerlist">
                        {!!getMod()?
                            <li id={getMod().id} className="mod-list-element">
                                <div>{getMod().name}</div>
                                <div></div>
                                <div></div>
                                <div><img src={mod}></img></div>
                            </li>
                        :''}
                        {getPlayer().map((p, i) =>
                            <li
                                onClick={selectPlayerToAsk}
                                id={p.id}
                                className={p.id === nextPlayer ? 'selected' : ''}>
                                <div onClick={selectPlayerToAsk} id={p.id}>{(i + 1) + ". " + p.name}</div>
                                <div className="joker">{hasJokerBeenUsed('fiftyfifty', p.id)?'':<img src={fficon}></img>}</div>
                                <div onClick={selectPlayerToAsk} id={p.id}>{p.rounds}<img src={rounds}></img></div>
                                <div onClick={selectPlayerToAsk} id={p.id}>{p.points}<img src={coin}></img></div>

                            </li>)
                        }
                    </ul>}
            </div>
        );
    }

    const renderQuestion = () => {
        let round = getCurrentRound();
        let askedPlayer = getPlayerToAsk();
        if (round !== null)
            return (
                <div>
                    <div className="mainbuttons buttonarray">
                        {isMod() ? <button onClick={endRound}>end Round</button> : ''}
                        {(isMod() && !hasJokerBeenUsed('fiftyfifty')) ? <button onClick={requestJoker} id="fiftyfifty">50:50</button> : ''}
                    </div>
                    {renderFile(round)}
                    <div className={"question"+(hasFile(round)?'':' questionnofile')}>
                        <p className="currentplayer">{askedPlayer.name+"\'s turn"}</p>
                        <div className="questionfield">{round.question.question}</div>
                        <div className="answersbuttons">
                            {round.order.map((a, i) =>
                                renderAnswerButton(a, i, round.question.answers[a].text)
                            )}
                        </div>
                    </div>
                    {isMod()?renderGuessList():''}
                </div>
            );
        return null;
    }

    const renderGuessList = () => {
        return (
            <ul className="playerlist guesslist">
                {getSpecs().map(a => 
                    <li className={a.selected===0?'false':(a.selected===1?'true':'notdef')}>
                        <div>{a.name}</div>
                        <div></div>
                        <div></div>
                        <div>{a.selected===0?'false':(a.selected===1?'true':'-')}</div>
                    </li>
                )}
            </ul>
        );
    }

    const renderAnswerButton = (a, i, text) => {
        if(getCurrentRound().jokertype==='fiftyfifty') {
            const toHide = getCurrentRound().jokerdata.findIndex(d => d+1 === a)!==-1;
            return (
                <button
                    disabled={!isAsk() || toHide}
                    onClick={() => updateRoundSelected(a)}
                    className={isSelectedAnswer(a) ? 'selected' : ''}>
                    <div>{QUESTIONPREFIX[i] + ")"}</div>
                    <div>{toHide?'':text}</div>
                </button>
            );
        } else return (
            <button
                disabled={!isAsk()}
                onClick={() => updateRoundSelected(a)}
                className={isSelectedAnswer(a) ? 'selected' : ''}>
                <div>{QUESTIONPREFIX[i] + ")"}</div>
                <div>{text}</div>
            </button>
        );
    }

    const renderSpecButtons = () => {
        return (
            <div className={"specbuttons"+(hasFile(getCurrentRound())?'':' questionnofile')}>
                <div>
                    <button className={(isSpecSelected(1) ? "selected" : "true")} onClick={() => updateRoundSelected(1)}>true</button>
                    <button className={(isSpecSelected(0) ? "selected" : "false")} onClick={() => updateRoundSelected(0)}>false</button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="navbar">
                <div className="buttonlist">
                    {isMod() ? <button onClick={closeGame} className="close"></button> : ''}
                    <button onClick={leaveGame} className="leave"></button>
                    <button onClick={getGame} className="reload"></button>
                </div>
                <img src={logo} alt="logo" className="logo"></img>
            </div>
            <div className="content">
                {showResult ? renderResultWindow() : ''}
                {renderState()}
            </div>


        </div>
    );
});

export default Game