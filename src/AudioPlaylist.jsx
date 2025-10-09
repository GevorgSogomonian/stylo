import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';



const AudioPlaylist = () => {
    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const redirectTo = (url) => {
        navigate(url);
    };

    useEffect(() => {
            fetch(`${backendUrl}/api/playList`,{method:'GET',credentials:'include'})
                .then(response => response.json())
                .then(data => setData(data))
                .catch(error => console.error('Error fetching data:', error));
        }, []);




    return (
        <div>
            <h1>PlayList</h1>
            <ul>
                {data.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
            <button className="back_up" onClick={() => redirectTo('/home')}></button>
            <button className="top-left-button5" onClick={() => redirectTo('/audio_upload')}>Загрузить трек</button>
        </div>
    );
    }
;

export default AudioPlaylist;
