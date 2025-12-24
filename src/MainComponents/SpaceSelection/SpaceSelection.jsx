import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import $api from '../../http/middleware';
import AvatarMenu from '../MainComponent/AvatarMenu';
import './SpaceSelection.css';

const SpaceSelection = () => {
    const [spaces, setSpaces] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteModal, setShowDeleteConfirmModal] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [newName, setNewName] = useState('');
    const navigate = useNavigate();

    const fetchSpaces = async () => {
        try {
            const res = await $api.get('/api/spaces');
            setSpaces(res.data);
        } catch (e) {
            console.error('Failed to fetch spaces', e);
        }
    };

    useEffect(() => {
        fetchSpaces();
    }, []);

    const handleSelectSpace = (space) => {
        localStorage.setItem('activeSpaceId', space.id);
        localStorage.setItem('activeSpaceName', space.name);
        navigate('/stylo');
    };

    const handleCreateSpace = async () => {
        if (!newName) return;
        try {
            await $api.post(`/api/spaces?name=${encodeURIComponent(newName)}`);
            setNewName('');
            setShowCreateModal(false);
            fetchSpaces();
        } catch (e) { console.error(e); }
    };

    const handleRenameSpace = async () => {
        if (!newName || !selectedSpace) return;
        try {
            await $api.put(`/api/spaces/${selectedSpace.id}?name=${encodeURIComponent(newName)}`);
            setNewName('');
            setShowRenameModal(false);
            fetchSpaces();
        } catch (e) { console.error(e); }
    };

    const handleDeleteSpace = async () => {
        if (!selectedSpace) return;
        try {
            await $api.delete(`/api/spaces/${selectedSpace.id}`);
            setShowDeleteConfirmModal(false);
            fetchSpaces();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-selection-container">
            <nav className="top-navi">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="logo" style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        paddingTop: '5px',
                        marginLeft: '-8px'
                    }}>Stylo</div>
                </div>
                <AvatarMenu />
            </nav>

            <main className="space-content">
                <div className="space-header">
                    <h2 style={{ fontWeight: '400', color: '#3c4043' }}>Select a Space</h2>
                    <button className="upload-btn" style={{ width: 'auto', padding: '0 24px' }} onClick={() => setShowCreateModal(true)}>
                        <span style={{ fontSize: '20px', marginRight: '8px' }}>+</span> Create Space
                    </button>
                </div>

                <div className="space-grid">
                    {spaces.map(space => (
                        <div key={space.id} className="space-card" onClick={() => handleSelectSpace(space)}>
                            <div className="space-card-info">
                                <span className="space-icon">📁</span>
                                <span className="space-name">{space.name}</span>
                            </div>
                            <div className="space-card-actions" onClick={e => e.stopPropagation()}>
                                <button className="nav-btn" onClick={() => { setSelectedSpace(space); setNewName(space.name); setShowRenameModal(true); }}>✎</button>
                                <button className="nav-btn" style={{ color: '#d93025' }} onClick={() => { setSelectedSpace(space); setShowDeleteConfirmModal(true); }}>✕</button>
                            </div>
                        </div>
                    ))}
                    {spaces.length === 0 && <p style={{ textAlign: 'center', gridColumn: 'span 3', color: '#70757a', marginTop: '40px' }}>No spaces yet. Create your first space to start designing!</p>}
                </div>
            </main>

            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ color: '#1a73e8', margin: '0 0 24px', fontWeight: '400' }}>Create New Space</h3>
                        <input type="text" placeholder="Space name" value={newName} onChange={e => setNewName(e.target.value)} className="google-input" />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn-confirm-modal" style={{ flex: 1 }} onClick={handleCreateSpace}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            {showRenameModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ color: '#1a73e8', margin: '0 0 24px', fontWeight: '400' }}>Rename Space</h3>
                        <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="google-input" />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowRenameModal(false)}>Cancel</button>
                            <button className="btn-confirm-modal" style={{ flex: 1 }} onClick={handleRenameSpace}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#d93025', fontWeight: '400' }}>Delete Space?</h3>
                        <p>Delete <strong>"{selectedSpace?.name}"</strong>? This will delete all photos and projects within this space.</p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowDeleteConfirmModal(false)}>Cancel</button>
                            <button className="btn-confirm-modal" style={{ flex: 1, background: '#d93025' }} onClick={handleDeleteSpace}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpaceSelection;
