import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AvatarMenu.css";

export default function AvatarMenu() {
    const [isOpen, setOpen] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [user, setUser] = useState(null);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('jwtToken');
            if (!token) return;
            try {
                const response = await fetch(`${backendUrl}/api/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                }
            } catch (error) { console.error(error); }
        };
        fetchUser();
    }, [backendUrl]);

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('selectedMannequinId');
        localStorage.removeItem('activeSpaceId');
        localStorage.removeItem('activeSpaceName');
        localStorage.removeItem('currentProjectId');
        navigate('/');
    };

    return (
        <div className="header_avatar" ref={menuRef}>
            <img
                src={user?.picture || "https://picsum.photos/40"}
                alt="avatar"
                className="avatar_but"
                onClick={() => setOpen(!isOpen)}
            />

            {isOpen && (
                <div className="avatar_menu">
                    <ul className="avatar_list">
                        <li className="avatar_list_item" onClick={() => { setShowInfo(true); setOpen(false); }}>
                            Profile Info
                        </li>
                        <li className="avatar_list_item" style={{ color: '#d93025', fontWeight: 'bold' }} onClick={handleLogout}>
                            Logout
                        </li>
                    </ul>
                </div>
            )}

            {showInfo && (
                <div className="modal-overlay" onClick={() => setShowInfo(false)}>
                    <div className="modal-content" style={{ width: '450px', padding: '32px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div style={{ textAlign: 'left' }}>
                                <h3 style={{ color: '#1a73e8', margin: '0 0 24px 0', fontWeight: '400', fontSize: '22px' }}>User Profile</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ margin: 0, fontSize: '16px', color: '#202124' }}>
                                        <span style={{ fontWeight: '500', color: '#5f6368' }}>Name: </span>{user?.name}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '16px', color: '#202124' }}>
                                        <span style={{ fontWeight: '500', color: '#5f6368' }}>Mail: </span>{user?.email}
                                    </p>
                                </div>
                            </div>
                            <img 
                                src={user?.picture || "https://picsum.photos/40"} 
                                alt="avatar" 
                                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '1px solid #dadce0', objectFit: 'cover' }}
                            />
                        </div>
                        <button className="btn-confirm-modal" style={{ width: '100%', marginTop: '8px' }} onClick={() => setShowInfo(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}