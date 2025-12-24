import './Home.css';
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Home = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            navigate("/spaces");
        }
    }, [navigate]);

    const handleStart = () => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            navigate('/spaces');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="home-logo">Stylo</div>
                <button className="home-login-btn" onClick={() => navigate('/login')}>Login</button>
            </header>
            
            <main className="home-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Your Personal <span className="highlight">AI Fashion</span> Assistant</h1>
                    <p className="hero-subtitle">
                        Create professional outfits, try on clothes virtually, and organize your digital wardrobe with the power of AI.
                    </p>
                    <button className="hero-cta" onClick={handleStart}>
                        Get Started
                    </button>
                </div>
            </main>

            <footer className="home-footer">
                <p>&copy; 2025 Stylo AI. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;