import queryString from 'query-string';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useParams } from 'react-router-dom';

const Game = forwardRef((props, ref) => {
    const [game, setGame] = useState('');
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
        getGame();
    }, []);

    return (
        <div>
            <h1>Game</h1>
            <p className="debug">{params.id}</p>
            <ul>
                {player.map(p => <li>{p.name}</li>)}
            </ul>
            <button onClick={getGame}>reload</button>
        </div>
    );
});

export default Game