import queryString from 'query-string';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser } from '../tools/connection';

const Game = forwardRef((props, ref) => {
    const [game, setGame] = useState(null);
    const [player, setPlayer] = useState([]);
    const params = useParams();

    const getGame = () => {
        props.send('joingame', {id: params.id});
    }

    useImperativeHandle(ref, () => ({
        loadGame (game) {
            setGame(game);
            console.log(game);
        },
        updatePlayerList (playerlist) {
            setPlayer(playerlist);
            console.log(playerlist);
        }
    }));

    useEffect(() => {
        //TODO wait until ws has been connected
        setTimeout(getGame, 500);
    }, []);

    const isMod = () => {
        return game!==null && game.mod === getUser().id;
    }

    return (
        <div>
            <h1>Game</h1>
            <p className="debug">{params.id}</p>
            <ul>
                {player.map(p => <li>{p.name}</li>)}
            </ul>
            <button onClick={getGame}>reload</button>
            {isMod()?<button>Start game</button>:''}
        </div>
    );
});

export default Game