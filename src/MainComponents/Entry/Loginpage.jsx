import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../../../Downloads/stylo-front/src/MainComponents/Entry/Loginpage.css';
import { FaGoogle } from 'react-icons/fa';

const LoginPage = () => {
    const navigate = useNavigate();
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
    const loginUrl = `${backendUrl}/login`;

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const redirectTo = (url) => {
        navigate(url);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, password }),
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.token;
                localStorage.setItem('jwtToken', token);
                console.log('Login successful', data);
                redirectTo('/stylo'); 
            } else {
                setErrorMessage('Invalid username or password');
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
        }
    };

    const handleGoogleLogin = () => {
        const targetUrl = `${backendUrl}/oauth2/authorization/google`;
        console.log('Redirecting to Google via:', targetUrl);
        window.location.assign(targetUrl);
    };

    return (
        <div className="container">
            <button className="top-left-button" onClick={() => redirectTo('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>←</span> Back
            </button>

            <div className="naming">
                <div className="logo" style={{ color: '#1a73e8', fontSize: '32px', fontWeight: '500', marginBottom: '8px', textAlign: 'center' }}>Stylo</div>
                <h1>Sign in</h1>
                <p style={{ color: '#5f6368', marginBottom: '32px', textAlign: 'center' }}>
                    Use your Google Account to sign in or create a new Stylo account
                </p>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="google-login-link"
                >
                    <FaGoogle style={{ color: '#4285F4', display: 'block' }} /> 
                    <span className="google-text" style={{ lineHeight: '1' }}>Continue with Google</span>
                </button>

                <p style={{ marginTop: '32px', fontSize: '12px', color: '#70757a', textAlign: 'center', lineHeight: '1.5' }}>
                    By continuing, Google will share your name, email address, language preference, and profile picture with Stylo.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;