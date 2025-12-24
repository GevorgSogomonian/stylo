import React, { useState } from 'react';
import './Registr.css';
import { useNavigate } from 'react-router-dom';

const UserForm = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [file, setFile] = useState(null);
    const [isNameTaken, setIsNameTaken] = useState(false);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('password', password);
        if (file) {
            formData.append('file', file);
        }

        try {
            const response = await fetch(`${backendUrl}/signup`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('jwtToken', data.token);
                navigate('/spaces');
            } else {
                alert("Registration failed. Please try again.");
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const checkName = async (name) => {
        if (!name) return;
        try {
            const response = await fetch(`${backendUrl}/api/checking`, {
                method: 'POST',
                body: JSON.stringify({ name }),
                headers: { 'Content-Type': 'application/json' }
            });
            setIsNameTaken(response.status !== 200);
        } catch (error) {
            console.error('Error checking name:', error);
        }
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);
        checkName(value);
    };

    return (
        <div className="registration-container">
            <button className="back-btn" onClick={() => navigate('/')}>
                ← Back
            </button>

            <div className="registration-card">
                <div className="logo">Stylo</div>
                <h1>Create account</h1>
                <p className="subtitle">Join Stylo fashion community</p>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <input
                        className={`input-field ${isNameTaken ? 'input-error' : ''}`}
                        type="text"
                        placeholder="Username"
                        value={name}
                        onChange={handleNameChange}
                        required
                    />
                    {isNameTaken && <div className="error-text">This name is already taken</div>}

                    <input
                        className="input-field"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <div className="file-input-wrapper">
                        <label className="file-label" htmlFor="avatar">
                            {file ? `Selected: ${file.name}` : 'Choose Avatar'}
                        </label>
                        <input
                            type="file"
                            id="avatar"
                            style={{ display: 'none' }}
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                    </div>

                    <button className="submit-btn" type="submit" disabled={isNameTaken}>
                        Create Account
                    </button>
                </form>

                <div className="login-link" onClick={() => navigate('/login')}>
                    Already have an account? Sign in
                </div>
            </div>
        </div>
    );
};

export default UserForm;