import './Home.css';
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";

const Home = () => {
    const navigate = useNavigate();
    useEffect(() => {
        if( localStorage.getItem('jwtToken')!==undefined && localStorage.getItem('jwtToken')!==null )
            navigate("/profile")
    }, []);

    const stairTextContainerStyles = {
        textAlign: 'left', // Выровнять текст по правому краю
        lineHeight: 1.5,
        marginRight: '20px',  // Отступ от правого края
    };

    const musicTextStyles = {
        fontSize: '48px',
        fontWeight: 'bold',
        textShadow: '0 0 5px rgba(0, 255, 0, 0.4), 0 0 10px rgba(0, 255, 0, 0.4)',
        background: 'linear-gradient(90deg, #00aa00, #002200, #00aa00)', // Тусклый зелено-черный градиент
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    };
    const redirectTo = (url) => {
        navigate(url);
    };
    return (
        <div>
            <img className="imgBack" src="" alt="background"/>
            <div className="text-wrapper" style={stairTextContainerStyles}>
                <div style={{...musicTextStyles, marginRight: '200px'}}>Го</div>
                <div style={{...musicTextStyles, marginRight: '75px'}}>в чат </div>
                <div style={{...musicTextStyles, marginRight: '-200px'}}>прямо сейчас</div>

            </div>
            <button className="submit-button__button submit" onClick={() => redirectTo('/stylo')}>Войти или зарегистрироваться</button>
        </div>
    );
};

export default Home;
