import './MainComponent.css';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarMenu from "./AvatarMenu";

const MainComponent = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const draggingRef = useRef(null);
    const resizingRef = useRef(null);
    const rotationRef = useRef(null);
    const workspaceRef = useRef(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetId: null, type: 'workspace' });
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
    
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadCategory, setUploadCategory] = useState('hats');

    const [hatsImages, setHatsImages] = useState([]);
    const [shoesImages, setShoesImages] = useState([]);
    const [legsImages, setLegsImages] = useState([]);
    const [torsoImages, setTorsoImages] = useState([]);
    const [otherImages, setOtherImages] = useState([]);
    const [mannequinImages, setMannequinImages] = useState([]);
    const [generatedLooks, setGeneratedLooks] = useState([]);
    const [savedProjects, setSavedProjects] = useState([]);
    const [currentProjectId, setCurrentProjectId] = useState(null);

    const [maneken, setManeken] = useState(null);
    const [showMannequinModal, setShowMannequinModal] = useState(false);
    const [showLooksModal, setShowLooksModal] = useState(false);
    const [showProjectsModal, setShowProjectsModal] = useState(false);
    const [showSaveProjectModal, setShowSaveProjectModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [newProjectName, setNewProjectName] = useState('');

    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showGenerateConfirmModal, setShowGenerateConfirmModal] = useState(false);
    const [showSaveNotification, setShowSaveNotification] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const [carouselStates, setCarouselStates] = useState({
        hats: { currentIndex: 0 }, torso: { currentIndex: 0 }, legs: { currentIndex: 0 }, shoes: { currentIndex: 0 }, other: { currentIndex: 0 }
    });

    const [activeImageId, setActiveImageId] = useState(null);
    const isInitialized = useRef(false);
    const photosMapRef = useRef({}); 

    const selectMannequin = (item) => { 
        setManeken(item.src); 
        localStorage.setItem('selectedMannequinId', item.id); 
        setShowMannequinModal(false); 
        // Принудительно запускаем синхронизацию
        syncWorkspaceToServer(images);
    };

    const triggerNotification = () => {
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 2000); 
    };

    const fetchImageBlob = useCallback(async (pId, token, spaceId) => {
        try {
            const res = await fetch(`${backendUrl}/api/photos/${pId}/raw`, { 
                headers: { 'Authorization': `Bearer ${token}`, 'X-Space-Id': spaceId } 
            });
            if (!res.ok) return null;
            const b = await res.blob();
            return URL.createObjectURL(b);
        } catch (e) { return null; }
    }, [backendUrl]);

    const scroll = (cat, dir) => {
        setCarouselStates(prev => {
            const imgs = { hats: hatsImages, torso: torsoImages, legs: legsImages, shoes: shoesImages, other: otherImages }[cat];
            const maxIdx = Math.max(0, Math.ceil(imgs.length / 3) - 1);
            let newIdx = (prev[cat]?.currentIndex || 0) + dir;
            if (newIdx < 0) newIdx = 0;
            if (newIdx > maxIdx) newIdx = maxIdx;
            return { ...prev, [cat]: { currentIndex: newIdx } };
        });
    };

    const handleFileUpload = (e) => { 
        const f = e.target.files[0]; 
        if (f) { 
            setSelectedFile(f); 
            setShowUploadModal(true); 
        } 
        e.target.value = ''; 
    };

    const uploadPhoto = async (file, cat) => {
        const formData = new FormData(); 
        formData.append('file', file); 
        formData.append('category', cat);
        const token = localStorage.getItem('jwtToken');
        const spaceId = localStorage.getItem('activeSpaceId');
        try {
            const res = await fetch(`${backendUrl}/api/photos`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'X-Space-Id': spaceId }, body: formData });
            if (res.ok) {
                const photo = await res.json();
                const url = await fetchImageBlob(photo.id, token, spaceId);
                if (url) {
                    photosMapRef.current[photo.id] = url;
                    const obj = { id: photo.id, src: url };
                    switch (cat) {
                        case "hats": setHatsImages(p => [...p, obj]); break;
                        case "torso": setTorsoImages(p => [...p, obj]); break;
                        case "legs": setLegsImages(p => [...p, obj]); break;
                        case "shoes": setShoesImages(p => [...p, obj]); break;
                        case "other": setOtherImages(p => [...p, obj]); break;
                        case "mannequin": setMannequinImages(p => [...p, obj]); setManeken(url); localStorage.setItem('selectedMannequinId', photo.id); break;
                        default: break;
                    }
                    return true;
                }
            }
        } catch (e) {} return false;
    };

    useEffect(() => {
        const initializeApp = async () => {
            const token = localStorage.getItem('jwtToken');
            const spaceId = localStorage.getItem('activeSpaceId');
            if (!token || !spaceId) return;
            try {
                const headers = { 'Authorization': `Bearer ${token}`, 'X-Space-Id': spaceId };
                
                const savedPid = localStorage.getItem('currentProjectId');
                if (savedPid) setCurrentProjectId(parseInt(savedPid));

                const savedMannequinId = localStorage.getItem('selectedMannequinId');
                const projectsRes = await fetch(`${backendUrl}/api/saved-states`, { headers });
                if (projectsRes.ok) setSavedProjects(await projectsRes.json());

                const response = await fetch(`${backendUrl}/api/photos`, { headers });
                if (response.ok) {
                    const photos = await response.json();
                    const photoPromises = photos.map(async (photo) => {
                        const url = await fetchImageBlob(photo.id, token, spaceId);
                        if (url) {
                            photosMapRef.current[photo.id] = url;
                            const obj = { id: photo.id, src: url };
                            switch (photo.category) {
                                case "hats": setHatsImages(p => [...p, obj]); break;
                                case "torso": setTorsoImages(p => [...p, obj]); break;
                                case "legs": setLegsImages(p => [...p, obj]); break;
                                case "shoes": setShoesImages(p => [...p, obj]); break;
                                case "other": setOtherImages(p => [...p, obj]); break;
                                case "generated-vto": setGeneratedLooks(p => [...p, obj]); break;
                                case "mannequin": 
                                    setMannequinImages(p => [...p, obj]);
                                    if (savedMannequinId && photo.id.toString() === savedMannequinId) setManeken(url);
                                    break;
                                default: break;
                            }
                        }
                    });
                    await Promise.all(photoPromises);
                }
                const wsResponse = await fetch(`${backendUrl}/api/workspace`, { headers });
                if (wsResponse.ok) {
                    const data = await wsResponse.json();
                    const wsItems = data.items;
                    
                    // Загружаем манекен если он есть
                    if (data.selectedMannequin) {
                        const mUrl = photosMapRef.current[data.selectedMannequin.id];
                        if (mUrl) {
                            setManeken(mUrl);
                            localStorage.setItem('selectedMannequinId', data.selectedMannequin.id);
                        } else {
                            // Если URL еще не в мапе, попробуем загрузить его
                            const url = await fetchImageBlob(data.selectedMannequin.id, token, spaceId);
                            if (url) {
                                setManeken(url);
                                localStorage.setItem('selectedMannequinId', data.selectedMannequin.id);
                            }
                        }
                    }

                    setImages(wsItems.map(item => ({ 
                        id: Date.now() + Math.random(), 
                        serverPhotoId: item.photo.id, 
                        src: photosMapRef.current[item.photo.id] || "", 
                        x: item.x, 
                        y: item.y, 
                        width: item.width, 
                        height: item.height,
                        rotation: item.rotation || 0
                    })).filter(img => img.src !== ""));
                }
                isInitialized.current = true;
            } catch (e) { console.error(e); }
        };
        initializeApp();
    }, [backendUrl, fetchImageBlob]);

    const syncWorkspaceToServer = useCallback(async (curr) => {
        if (!isInitialized.current) return;
        const token = localStorage.getItem('jwtToken');
        const spaceId = localStorage.getItem('activeSpaceId');
        if (!token || !spaceId) return;
        
        const mId = localStorage.getItem('selectedMannequinId');
        
        const payload = {
            mannequinId: mId ? parseInt(mId) : null,
            items: curr.filter(img => img.serverPhotoId).map(img => ({ 
                serverPhotoId: img.serverPhotoId, 
                x: Math.round(img.x), 
                y: Math.round(img.y), 
                width: Math.round(img.width), 
                height: Math.round(img.height),
                rotation: img.rotation || 0
            }))
        };
        
        try { await fetch(`${backendUrl}/api/workspace`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'X-Space-Id': spaceId, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch (e) {}
    }, [backendUrl]);

    useEffect(() => { const t = setTimeout(() => syncWorkspaceToServer(images), 1000); return () => clearTimeout(t); }, [images, syncWorkspaceToServer]);

    const removeWhiteBackground = (src) => {
        return new Promise((resolve) => {
            const img = new Image(); img.crossOrigin = 'anonymous'; img.src = src;
            img.onload = () => {
                const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
                canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0);
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < data.data.length; i += 4) if (data.data[i] > 240 && data.data[i+1] > 240 && data.data[i+2] > 240) data.data[i+3] = 0;
                ctx.putImageData(data, 0, 0); resolve({ src: canvas.toDataURL(), w: img.width, h: img.height });
            };
            img.onerror = () => resolve({ src, w: 150, h: 150 });
        });
    };

    const confirmUpload = async () => { if (selectedFile && await uploadPhoto(selectedFile, uploadCategory)) { setShowUploadModal(false); setSelectedFile(null); } };

    const handleDragStart = (e, url, cat, pId) => {
        e.dataTransfer.setData('imageUrl', url); e.dataTransfer.setData('category', cat);
        if (pId) e.dataTransfer.setData('photoId', pId);
        e.target.style.opacity = '0.4';
    };

    const handleDragEnd = (e) => { e.target.style.opacity = '1'; };

    const handleDrop = async (e) => {
        e.preventDefault(); setIsDragOver(false);
        const url = e.dataTransfer.getData('imageUrl'); const pId = e.dataTransfer.getData('photoId');
        if (url) {
            const rect = workspaceRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
            let finalSrc, naturalW, finalH;
            if (!pId) {
                const result = await removeWhiteBackground(url);
                finalSrc = result.src; naturalW = result.w; finalH = result.h;
            } else {
                finalSrc = url;
                const getDim = (s) => new Promise(r => { const i = new Image(); i.onload = () => r({w:i.width, h:i.height}); i.src=s; });
                const dim = await getDim(url); naturalW = dim.w; finalH = dim.h;
            }
            const ratio = naturalW / finalH; const initialW = 150; const initialH = initialW / ratio;
            const x = e.clientX - centerX - (initialW / 2); const y = e.clientY - centerY - (initialH / 2);
            setImages(p => [...p, { id: Date.now(), src: finalSrc, x: Math.round(x), y: Math.round(y), width: initialW, height: Math.round(initialH), serverPhotoId: pId ? parseInt(pId) : null, rotation: 0 }]);
        }
    };

    const handleDropToCategory = async (eOrId, cat) => {
        let imgObj = null, isFromWS = false, wsId = null;
        if (typeof eOrId === 'object' && eOrId.dataTransfer) {
            eOrId.preventDefault();
            const wId = eOrId.dataTransfer.getData("imageId"), sId = eOrId.dataTransfer.getData("photoId"), url = eOrId.dataTransfer.getData("imageUrl");
            if (eOrId.dataTransfer.getData("category") === cat) return;
            if (wId) { wsId = +wId; imgObj = images.find(i => i.id === wsId); isFromWS = true; }
            else if (sId) imgObj = { serverPhotoId: parseInt(sId), src: url };
        } else { wsId = eOrId; imgObj = images.find(i => i.id === wsId); isFromWS = true; }
        if (!imgObj) return;
        const token = localStorage.getItem('jwtToken');
        const spaceId = localStorage.getItem('activeSpaceId');
        if (imgObj.serverPhotoId) {
            try {
                const res = await fetch(`${backendUrl}/api/photos/${imgObj.serverPhotoId}?category=${cat}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'X-Space-Id': spaceId } });
                if (res.ok) {
                    const upd = await res.json(); const obj = { id: upd.id, src: imgObj.src };
                    const filter = (p) => p.filter(i => i.id !== upd.id);
                    setHatsImages(filter); setTorsoImages(filter); setLegsImages(filter); setShoesImages(filter); setOtherImages(filter);
                    switch (cat) { case "hats": setHatsImages(p => [...p, obj]); break; case "torso": setTorsoImages(p => [...p, obj]); break; case "legs": setLegsImages(p => [...p, obj]); break; case "shoes": setShoesImages(p => [...p, obj]); break; case "other": setOtherImages(p => [...p, obj]); break; default: break; }
                    if (isFromWS) setImages(p => p.filter(i => i.id !== wsId));
                }
            } catch (e) {} return;
        }
        try {
            const res = await fetch(imgObj.src); const b = await res.blob();
            if (await uploadPhoto(new File([b], `s_${Date.now()}.png`, { type: "image/png" }), cat)) if (isFromWS) setImages(p => p.filter(i => i.id !== wsId));
        } catch (e) {}
    };

    const handlePointerDownImage = (e, id) => { 
        e.preventDefault(); e.stopPropagation(); 
        const idx = images.findIndex((p) => p.id === id);
        if (idx !== -1) {
            const item = images[idx];
            setImages([...images.filter((p) => p.id !== id), item]);
        }
        setActiveImageId(id); 
        const rect = workspaceRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
        const img = images.find(i => i.id === id);
        draggingRef.current = { id, offsetX: e.clientX - (centerX + img.x), offsetY: e.clientY - (centerY + img.y) }; 
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} 
    };

    const handlePointerDownResize = (e, id) => { 
        e.preventDefault(); e.stopPropagation(); setActiveImageId(id); 
        const img = images.find(i => i.id === id); 
        if (img) { resizingRef.current = { id, startX: e.clientX, startY: e.clientY, startWidth: img.width, startHeight: img.height, ratio: img.width / img.height }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} } 
    };

    const handlePointerDownRotate = (e, id) => {
        e.preventDefault(); e.stopPropagation(); setActiveImageId(id);
        const img = images.find(i => i.id === id);
        if (img) {
            const rect = workspaceRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2 + img.x;
            const centerY = rect.top + rect.height / 2 + img.y;
            const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
            rotationRef.current = { id, startAngle, initialRotation: img.rotation || 0, centerX, centerY };
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
        }
    };

    useEffect(() => {
        const move = (e) => {
            const rect = workspaceRef.current?.getBoundingClientRect();
            if (!rect) return;
            const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
            if (draggingRef.current) { const { id, offsetX, offsetY } = draggingRef.current; setImages(p => p.map(i => i.id === id ? { ...i, x: Math.round(e.clientX - centerX - offsetX), y: Math.round(e.clientY - centerY - offsetY) } : i)); }
            if (resizingRef.current) { 
                const { id, startX, startY, startWidth, startHeight, ratio } = resizingRef.current; 
                const deltaX = e.clientX - startX; const deltaY = e.clientY - startY;
                const sX = (startWidth + deltaX) / startWidth; const sY = (startHeight + deltaY) / startHeight; const scale = (sX + sY) / 2;
                const newW = Math.max(20, startWidth * scale); const newH = newW / ratio;
                setImages(p => p.map(i => i.id === id ? { ...i, width: Math.round(newW), height: Math.round(newH) } : i)); 
            }
            if (rotationRef.current) {
                const { id, startAngle, initialRotation, centerX: imgCenterX, centerY: imgCenterY } = rotationRef.current;
                const currentAngle = Math.atan2(e.clientY - imgCenterY, e.clientX - imgCenterX) * (180 / Math.PI);
                let newRotation = initialRotation + (currentAngle - startAngle);
                setImages(p => p.map(i => i.id === id ? { ...i, rotation: Math.round(newRotation) } : i));
            }
        };
        const up = () => { draggingRef.current = null; resizingRef.current = null; rotationRef.current = null; };
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
        return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    }, [images]);

    const handleContextMenu = (e, id, type = 'workspace') => { e.preventDefault(); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetId: id, type }); };
    
    const handleDeleteFromServer = async (e) => {
        if (e) e.stopPropagation();
        const pId = (contextMenu.type === 'gallery' || contextMenu.type === 'mannequin' || contextMenu.type === 'generated-vto') ? contextMenu.targetId : images.find(i => i.id === contextMenu.targetId)?.serverPhotoId;
        if (!pId) { setContextMenu({ visible: false, x: 0, y: 0, targetId: null, type: null }); return; }
        const token = localStorage.getItem('jwtToken');
        try {
            const res = await fetch(`${backendUrl}/api/photos/${pId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const f = (p) => p.filter(i => i.id !== pId);
                setHatsImages(f); setTorsoImages(f); setLegsImages(f); setShoesImages(f); setOtherImages(f); setMannequinImages(f); setGeneratedLooks(f);
                setImages(p => p.filter(i => i.serverPhotoId !== pId));
                if (localStorage.getItem('selectedMannequinId') === pId.toString()) { localStorage.removeItem('selectedMannequinId'); setManeken(null); }
            }
        } catch (e) {} setContextMenu({ visible: false, x: 0, y: 0, targetId: null, type: null });
    };

    useEffect(() => {
        const handleClick = (e) => { if (e.target.closest('.context-menu')) return; setContextMenu({ visible: false, x: 0, y: 0, targetId: null, type: null }); };
        window.addEventListener('click', handleClick, true); return () => window.removeEventListener('click', handleClick, true);
    }, []);

    const handleGenerateLook = async () => {
        const mId = localStorage.getItem('selectedMannequinId'); if (!mId) { alert("Выберите манекен"); return; }
        const cIds = images.filter(i => i.serverPhotoId).map(i => i.serverPhotoId); if (cIds.length === 0) { alert("Добавьте вещи"); return; }
        setGeneratedResult(null); setIsGenerating(true); setShowGenerateModal(true);
        const spaceId = localStorage.getItem('activeSpaceId');
        const token = localStorage.getItem('jwtToken');
        try {
            const res = await fetch(`${backendUrl}/api/virtual-try-on`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'X-Space-Id': spaceId, 'Content-Type': 'application/json' }, body: JSON.stringify({ mannequinPhotoId: parseInt(mId), clothingPhotoIds: cIds }) });
            if (res.ok) {
                const photo = await res.json();
                const url = await fetchImageBlob(photo.id, token, spaceId);
                if (url) { setGeneratedResult(url); setGeneratedLooks(p => [...p, { id: photo.id, src: url }]); }
            } else { alert("Ошибка AI"); setShowGenerateModal(false); }
        } catch (e) { console.error(e); setShowGenerateModal(false); } finally { setIsGenerating(false); }
    };

    const saveCurrentProject = async () => {
        if (!newProjectName && !currentProjectId) return;
        const mId = localStorage.getItem('selectedMannequinId');
        const token = localStorage.getItem('jwtToken');
        const spaceId = localStorage.getItem('activeSpaceId');
        const payload = { 
            name: newProjectName, 
            mannequinId: mId ? parseInt(mId) : null, 
            items: images.filter(i => i.serverPhotoId).map(i => ({ 
                serverPhotoId: i.serverPhotoId, 
                x: Math.round(i.x), 
                y: Math.round(i.y), 
                width: Math.round(i.width), 
                height: Math.round(i.height),
                rotation: i.rotation || 0
            })) 
        };
        try {
            if (currentProjectId) {
                const res = await fetch(`${backendUrl}/api/saved-states/${currentProjectId}/content`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'X-Space-Id': spaceId, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) { const upd = await res.json(); setSavedProjects(p => p.map(i => i.id === upd.id ? upd : i)); triggerNotification(); }
            } else {
                const res = await fetch(`${backendUrl}/api/saved-states`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'X-Space-Id': spaceId, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                if (res.ok) { const newP = await res.json(); setSavedProjects(p => [...p, newP]); setCurrentProjectId(newP.id); localStorage.setItem('currentProjectId', newP.id); setShowSaveProjectModal(false); setNewProjectName(''); triggerNotification(); }
            }
        } catch (e) {}
    };

    const loadProject = (proj) => {
        if (proj.mannequin) { const mUrl = photosMapRef.current[proj.mannequin.id]; if (mUrl) { setManeken(mUrl); localStorage.setItem('selectedMannequinId', proj.mannequin.id); } else { setManeken(null); localStorage.removeItem('selectedMannequinId'); } } else { setManeken(null); localStorage.removeItem('selectedMannequinId'); }
        setImages(proj.items.map(i => ({ 
            id: Date.now() + Math.random(), 
            serverPhotoId: i.photo.id, 
            src: photosMapRef.current[i.photo.id] || "", 
            x: i.x, 
            y: i.y, 
            width: i.width, 
            height: i.height,
            rotation: i.rotation || 0
        })).filter(img => img.src !== ""));
        setCurrentProjectId(proj.id); localStorage.setItem('currentProjectId', proj.id); setShowProjectsModal(false);
    };

    const deleteProject = async (id) => { 
        const spaceId = localStorage.getItem('activeSpaceId');
        const token = localStorage.getItem('jwtToken');
        try { const res = await fetch(`${backendUrl}/api/saved-states/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'X-Space-Id': spaceId } }); if (res.ok) setSavedProjects(p => p.filter(i => i.id !== id)); } catch (e) {} 
    };
    const renameProject = async (id, name) => { 
        const spaceId = localStorage.getItem('activeSpaceId');
        const token = localStorage.getItem('jwtToken');
        try { const res = await fetch(`${backendUrl}/api/saved-states/${id}?name=${encodeURIComponent(name)}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'X-Space-Id': spaceId } }); if (res.ok) { const upd = await res.json(); setSavedProjects(p => p.map(i => i.id === id ? upd : i)); } } catch (e) {} 
    };

    const handleExitSpace = () => {
        localStorage.removeItem('activeSpaceId'); localStorage.removeItem('activeSpaceName'); localStorage.removeItem('currentProjectId');
        navigate('/spaces');
    };

    const download = (url, fn = 'stylo.png') => { const l = document.createElement('a'); l.href = url; l.download = fn; document.body.appendChild(l); l.click(); document.body.removeChild(l); };

    return (
        <div className="main-container">
            <aside className="sidebar">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="upload-btn" style={{ background: '#1a73e8', color: '#fff', border: 'none', height: '40px', padding: '0 16px' }}> 
                        <span style={{ fontSize: '20px', marginRight: '8px' }}>+</span> Upload clothes 
                        <input type="file" accept="image/*" multiple onChange={handleFileUpload} style={{display: 'none'}} /> 
                    </label>
                    <button className="redact_maneken_but" style={{ background: '#ffffff', color: '#1a73e8', border: '1px solid #dadce0', height: '40px' }} onClick={() => setShowMannequinModal(true)}> 👤 My Mannequins ({mannequinImages.length}) </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                    {['hats', 'torso', 'legs', 'shoes', 'other'].map(cat => {
                        const title = { hats: "Head", torso: "Tops", legs: "Bottoms", shoes: "Shoes", other: "Other" }[cat];
                        const imgs = { hats: hatsImages, torso: torsoImages, legs: legsImages, shoes: shoesImages, other: otherImages }[cat];
                        return (
                            <div key={cat} className="category-section" onDragOver={e => e.preventDefault()} onDrop={e => handleDropToCategory(e, cat)}>
                                <div className="category-header"> <h3>{title}</h3>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button className="nav-btn" onClick={(e) => { e.stopPropagation(); scroll(cat, -1); }}>‹</button>
                                        <button className="nav-btn" onClick={(e) => { e.stopPropagation(); scroll(cat, 1); }}>›</button>
                                    </div>
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', transition: 'transform 0.3s', transform: `translateX(-${(carouselStates[cat]?.currentIndex || 0) * 100}%)` }}>
                                        {Array.from({ length: Math.ceil(imgs.length / 3) }).map((_, gIdx) => (
                                            <div key={gIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', flex: '0 0 100%' }}>
                                                {imgs.slice(gIdx * 3, gIdx * 3 + 3).map(i => (
                                                    <img 
                                                        key={i.id} 
                                                        src={i.src} 
                                                        alt="clothing item" 
                                                        className="gallery-item" 
                                                        draggable 
                                                        onDragStart={e => handleDragStart(e, i.src, cat, i.id)} 
                                                        onDragEnd={handleDragEnd}
                                                        onContextMenu={e => handleContextMenu(e, i.id, 'gallery')} 
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', flexShrink: 0 }}>
                    <button className="redact_maneken_but" style={{ background: '#ffffff', color: '#1a73e8', border: '1px solid #dadce0', height: '40px' }} onClick={(e) => { e.stopPropagation(); setShowLooksModal(true); }}> 🖼 My Outfits ({generatedLooks.length}) </button>
                    <button className="redact_maneken_but" style={{ background: '#ffffff', color: '#1a73e8', border: '1px solid #dadce0', height: '40px' }} onClick={(e) => { e.stopPropagation(); setShowProjectsModal(true); }}> 📁 My Projects ({savedProjects.length}) </button>
                    <button className="upload-btn" style={{ height: '40px' }} onClick={() => { setCurrentProjectId(null); localStorage.removeItem('currentProjectId'); setShowSaveProjectModal(true); }}> <span style={{ fontSize: '20px', marginRight: '8px' }}>+</span> New Project </button>
                </div>
            </aside>

            <main className="content">
                <nav className="top-navi"> 
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="logo" onClick={handleExitSpace} style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center',
                            paddingTop: '5px',
                            marginLeft: '-8px'
                        }}>Stylo</div>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            color: '#5f6368', 
                            fontSize: '13px', 
                            background: '#f1f3f4', 
                            padding: '0 16px', 
                            borderRadius: '20px', 
                            height: '32px',
                            border: '1px solid #e8eaed',
                            lineHeight: '1',
                            whiteSpace: 'nowrap'
                        }}>
                            <span>{localStorage.getItem('activeSpaceName')}</span>
                            {currentProjectId && (
                                <>
                                    <span style={{ color: '#dadce0' }}>|</span>
                                    <span style={{ color: '#202124', fontWeight: '500' }}>
                                        {savedProjects.find(p => p.id === currentProjectId)?.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '100%' }}>
                        <button className="btn-cancel" style={{ 
                            height: '32px', 
                            padding: '0 16px', 
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: '1',
                            margin: 0
                        }} onClick={handleExitSpace}>🚪 Exit Space</button>
                        <AvatarMenu /> 
                    </div>
                </nav>
                <div className={`editor-area ${isDragOver ? 'drag-over' : ''}`} ref={workspaceRef} onDragOver={e => { e.preventDefault(); setIsDragOver(true); }} onDrop={handleDrop} onDragLeave={() => setIsDragOver(false)} onClick={() => setActiveImageId(null)}>
                    {maneken && <img src={maneken} alt="mannequin" className="mannequin" />}
                    {images.map(i => (
                        <div key={i.id} className={`image-wrapper ${activeImageId === i.id ? 'active' : ''}`} style={{ 
                            left: `calc(50% + ${i.x}px)`, 
                            top: `calc(50% + ${i.y}px)`, 
                            width: i.width, 
                            height: i.height,
                            transform: `rotate(${i.rotation || 0}deg)`
                        }} onContextMenu={e => handleContextMenu(e, i.id)} onClick={e => { e.stopPropagation(); setActiveImageId(i.id); }}>
                            <img src={i.src} alt="workspace item" className="draggable-img" onPointerDown={e => handlePointerDownImage(e, i.id)} />
                            <div className="resize-handle" onPointerDown={e => handlePointerDownResize(e, i.id)} />
                            <div className="rotate-handle" onPointerDown={e => handlePointerDownRotate(e, i.id)} />
                        </div>
                    ))}
                    
                    <div className={`save-notification ${showSaveNotification ? 'visible' : ''}`}>✓</div>

                    <div className="workspace-actions">
                        <button className="save-btn-secondary" onClick={(e) => { e.stopPropagation(); currentProjectId ? saveCurrentProject() : setShowSaveProjectModal(true); }}>💾 Save Project</button>
                        <button className="save-btn" onClick={(e) => { e.stopPropagation(); setShowGenerateConfirmModal(true); }}>✨ Generate look</button>
                    </div>
                </div>
            </main>

            {contextMenu.visible && (
                <div className="context-menu" style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 2000000 }} onClick={e => e.stopPropagation()}>
                    {contextMenu.type === 'workspace' ? (
                        <> <div className="context-item" onClick={e => { setImages(p => p.filter(i => i.id !== contextMenu.targetId)); setContextMenu({ visible: false }); }}>Remove</div>
                           <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }} />
                           <div className="context-item" style={{ color: '#d93025' }} onClick={handleDeleteFromServer}>Delete from Gallery</div>
                        </>
                    ) : (
                        <> <div className="context-item" onClick={() => { const i = (contextMenu.type === 'mannequin' ? mannequinImages : generatedLooks).find(x => x.id === contextMenu.targetId); if (i) download(i.src); setContextMenu({ visible: false }); }}>Download</div>
                           <div style={{ borderTop: '1px solid #eee', margin: '4px 0' }} />
                           <div className="context-item" style={{ color: '#d93025' }} onClick={handleDeleteFromServer}>{contextMenu.type === 'mannequin' ? 'Удалить манекен' : 'Delete'}</div>
                        </>
                    )}
                </div>
            )}

            {showUploadModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '320px', padding: '24px' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '20px' }}>Upload clothes</h3>
                        <p style={{ fontSize: '13px', color: '#5f6368' }}>File: {selectedFile?.name}</p>
                        
                        <div style={{ marginBottom: '20px', position: 'relative', zIndex: 1000001 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#1a73e8', textTransform: 'uppercase' }}>
                                Category
                            </label>
                            <select 
                                value={uploadCategory} 
                                onChange={e => setUploadCategory(e.target.value)} 
                                style={{ 
                                    width: '100%', 
                                    height: '40px', 
                                    padding: '0 12px', 
                                    borderRadius: '8px', 
                                    border: '2px solid #dadce0', 
                                    background: '#ffffff', 
                                    color: '#3c4043',
                                    display: 'block',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    zIndex: 1000002
                                }}
                            >
                                <option value="hats" style={{color: '#000'}}>Headwear</option>
                                <option value="torso" style={{color: '#000'}}>Tops</option>
                                <option value="legs" style={{color: '#000'}}>Bottoms</option>
                                <option value="shoes" style={{color: '#000'}}>Footwear</option>
                                <option value="other" style={{color: '#000'}}>Other</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowUploadModal(false)}>Cancel</button>
                            <button className="btn-confirm-modal" style={{ flex: 1 }} onClick={confirmUpload}>Upload</button>
                        </div>
                    </div>
                </div>
            )}
            {showSaveProjectModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ padding: '24px', width: '350px' }}>
                        <h3 style={{ margin: '0 0 24px 0', lineHeight: '1', textAlign: 'left', color: '#1a73e8', fontWeight: '400' }}>
                            {currentProjectId ? 'Save Project' : 'New Project'}
                        </h3>
                        <input 
                            type="text" 
                            placeholder="Project name" 
                            value={newProjectName} 
                            onChange={e => setNewProjectName(e.target.value)} 
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dadce0', marginBottom: '24px', boxSizing: 'border-box', fontSize: '14px' }} 
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowSaveProjectModal(false)}>Cancel</button>
                            <button className="btn-confirm-modal" style={{ flex: 1 }} onClick={saveCurrentProject}>Save</button>
                        </div>
                    </div>
                </div>
            )}
            {showMannequinModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px', padding: '24px' }}>
                        <h3 style={{ color: '#1a73e8', margin: '0 0 24px', fontWeight: '400', lineHeight: '1', textAlign: 'left' }}>My Mannequins</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#f1f3f4', padding: '8px', borderRadius: '12px' }}>
                            {mannequinImages.map(i => <img key={i.id} src={i.src} alt="mannequin" style={{ width: '100%', height: '100px', objectFit: 'contain', cursor: 'pointer', border: maneken === i.src ? '2px solid #1a73e8' : 'none', borderRadius: '8px', background: '#fff' }} onClick={() => selectMannequin(i)} onContextMenu={e => handleContextMenu(e, i.id, 'mannequin')} />)}
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="btn-confirm-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: '40px', fontSize:'14px', margin: 0 }}>
                                <span style={{ marginRight: '8px', fontSize: '18px' }}>+</span> Add Mannequin
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => { if (e.target.files[0] && await uploadPhoto(e.target.files[0], 'mannequin')) setShowMannequinModal(false); }} />
                            </label>
                            <button className="btn-cancel" style={{ width: '100%', height: '40px', fontSize: '14px' }} onClick={() => setShowMannequinModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
            {showLooksModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '600px', padding: '24px' }}>
                        <h3 style={{ margin: '0 0 24px 0', lineHeight: '1', textAlign: 'left', color: '#1a73e8', fontWeight: '400' }}>My Outfits</h3>
                        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', maxHeight:'400px', overflowY:'auto', padding:'12px', background:'#f1f3f4', borderRadius:'16px'}}>
                            {generatedLooks.map(i => <img key={i.id} src={i.src} alt="look" style={{width:'100%', aspectRatio:'3/4', objectFit:'contain', background:'#fff', borderRadius:'12px', cursor:'pointer'}} onClick={() => { setGeneratedResult(i.src); setShowGenerateModal(true); }} onContextMenu={e => handleContextMenu(e, i.id, 'generated-vto')} />)}
                        </div>
                        <button className="btn-cancel" style={{width:'100%', marginTop:'20px'}} onClick={() => setShowLooksModal(false)}>Close</button>
                    </div>
                </div>
            )}
            {showProjectsModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px', padding: '24px' }}>
                        <h3 style={{ color: '#1a73e8', textAlign: 'left', margin: '0 0 24px', fontWeight: '400' }}>My Projects</h3>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {savedProjects.map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f1f3f4', borderRadius: '12px' }}>
                                    <span style={{ fontWeight: '500', cursor: 'pointer', flex: 1 }} onClick={() => loadProject(p)}>{p.name}</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="nav-btn" onClick={() => { setSelectedProject(p); setNewProjectName(p.name); setShowRenameModal(true); }}>✎</button>
                                        <button className="nav-btn" style={{ color: '#d93025' }} onClick={() => { setSelectedProject(p); setShowDeleteConfirmModal(true); }}>✕</button>
                                    </div>
                                </div>
                            ))}
                            {savedProjects.length === 0 && <p style={{ textAlign: 'center', color: '#70757a' }}>No saved projects yet</p>}
                        </div>
                        <button className="btn-cancel" style={{ width: '100%', marginTop: '20px' }} onClick={() => setShowProjectsModal(false)}>Close</button>
                    </div>
                </div>
            )}
            {showRenameModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ padding: '24px', width: '350px' }}>
                        <h3 style={{ margin: '0 0 24px 0', lineHeight: '1', textAlign: 'left', color: '#1a73e8', fontWeight: '400' }}>Rename Project</h3>
                        <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dadce0', marginBottom: '24px', boxSizing:'border-box' }} />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowRenameModal(false)}>Cancel</button>
                            <button className="btn-confirm-modal" style={{ flex: 1 }} onClick={() => { renameProject(selectedProject.id, newProjectName); setShowRenameModal(false); }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
            {showDeleteConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center' }}>
                        <h3 style={{ color: '#d93025', fontWeight:'400' }}>Delete Project?</h3>
                        <p>Delete <strong>"{selectedProject?.name}"</strong>?</p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowDeleteConfirmModal(false)}>Cancel</button>
                            <button className="btn-confirm-modal" style={{ flex: 1, background: '#d93025' }} onClick={() => { deleteProject(selectedProject.id); setShowDeleteConfirmModal(false); }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
            {showGenerateConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center', width: '350px', padding: '24px' }}>
                        <h3 style={{ color: '#1a73e8', margin: '0 0 16px', fontWeight: '400' }}>Generate Outfit?</h3>
                        <p>AI will now process your selected items and create a professional fashion look.</p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button className="btn-cancel" style={{ flex: 1 }} onClick={() => setShowGenerateConfirmModal(false)}>Cancel</button>
                            <button className="btn-confirm-modal" style={{ flex: 1 }} onClick={() => { setShowGenerateConfirmModal(false); handleGenerateLook(); }}>Generate</button>
                        </div>
                    </div>
                </div>
            )}
            {showGenerateModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px', textAlign: 'center', padding: '24px' }}>
                        <h3 style={{ margin: '0 0 24px 0', lineHeight: '1', fontWeight:'400' }}>{isGenerating ? 'AI Stylist' : 'Result'}</h3>
                        {isGenerating ? (
                            <div className="generation-loader">
                                <div className="loader-spinner"></div>
                                <p>AI is creating your unique look...</p>
                            </div>
                        ) : (
                            <>
                                <img src={generatedResult} alt="result" style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '12px', background: '#f1f3f4' }} />
                                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', alignItems: 'center', justifyContent: 'center' }}>
                                    <button className="btn-cancel" style={{ flex: 1, margin: 0, height: '40px', boxSizing: 'border-box' }} onClick={() => download(generatedResult)}>Download</button>
                                    <button className="btn-confirm-modal" style={{ flex: 1, height: '40px', margin: 0, boxSizing: 'border-box', border: '1px solid transparent' }} onClick={() => setShowGenerateModal(false)}>Close</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainComponent;