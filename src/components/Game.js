import queryString from 'query-string';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useParams } from 'react-router-dom';

const Game = forwardRef((props, ref) => {
    const [game, setGame] = useState('');
    const params = useParams();

    const getGame = () => {
        props.send('getgame', {id: params.id});
    }

    useImperativeHandle(ref, () => ({
        loadGame (game) {
            setGame(game);
            console.log(game);
        }
    }));

    useEffect(() => {
        getGame();
    }, []);

    return (
        <div>
            <h1>Game</h1>
            <p className="debug">{params.id}</p>
            <button onClick={getGame}>reload</button>
        </div>
    );
});

export default Game