import './MainComponent.css';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from "html2canvas";
const MainComponent = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const draggingRef = useRef(null);
    const resizingRef = useRef(null);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const workspaceRef = useRef(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });

    // === Поиск ===
    const handleSearchChange = (e) => {
        const value = e.target.value.trim();
        setQuery(value);
        if (value.length > 2) {
            const results = Array.from({ length: 5 }).map((_, i) => ({
                id: Date.now() + i,
                src: `https://picsum.photos/120?random=${Math.floor(Math.random() * 1000)}`
            }));
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };
    const handleSaveLook = async () => {
        if (!workspaceRef.current) return;

        // 1. Создаем временный контейнер
        const tempContainer = document.createElement("div");
        // Используем те же стили, что и у editor-area для корректного рендеринга
        tempContainer.style.width = workspaceRef.current.offsetWidth + "px";
        tempContainer.style.height = workspaceRef.current.offsetHeight + "px";
        tempContainer.style.position = "absolute";
        tempContainer.style.top = "0";
        tempContainer.style.left = "-9999px"; // Скрываем его за пределами экрана
        tempContainer.style.backgroundColor = "#ffffff";
        document.body.appendChild(tempContainer);

        // 2. Копируем манекен
        const originalMannequin = workspaceRef.current.querySelector(".mannequin");
        if (!originalMannequin) {
            document.body.removeChild(tempContainer);
            return;
        }
        const clonedMannequin = originalMannequin.cloneNode(true);
        tempContainer.appendChild(clonedMannequin);

        // 3. Копируем все перемещаемые картинки
        const imageWrappers = workspaceRef.current.querySelectorAll(".image-wrapper");

        // Отключаем рамки и элементы интерфейса перед снимком на оригинальных элементах
        const resizeHandles = workspaceRef.current.querySelectorAll(".resize-handle");
        resizeHandles.forEach((el) => (el.style.display = "none"));

        imageWrappers.forEach((wrapper) => {
            const clonedWrapper = wrapper.cloneNode(true);
            // Удаляем рукоятки ресайза из клона, чтобы они не попали на снимок
            const clonedResizeHandle = clonedWrapper.querySelector(".resize-handle");
            if (clonedResizeHandle) {
                clonedResizeHandle.remove();
            }
            tempContainer.appendChild(clonedWrapper);
        });

        try {
            // 4. Используем html2canvas для снимка временного контейнера
            const canvas = await html2canvas(tempContainer, {
                backgroundColor: "#ffffff",
                useCORS: true,
                scale: 2,
            });

            // Включаем рамки обратно на оригинальных элементах
            resizeHandles.forEach((el) => (el.style.display = "block"));

            // 💡 Копируем как PNG
            const blobPng = await new Promise((resolve) =>
                canvas.toBlob(resolve, "image/png", 1.0)
            );

            if (!blobPng) return;

            // Пытаемся скопировать в буфер
            await navigator.clipboard.write([
                new ClipboardItem({
                    "image/png": blobPng,
                }),
            ]);
            alert("✅ Изображение скопировано в буфер обмена!");
        } catch (err) {
            console.error("Ошибка при сохранении:", err);
            // Всегда включаем рамки обратно, даже если произошла ошибка
            resizeHandles.forEach((el) => (el.style.display = "block"));
        } finally {
            // 5. Удаляем временный контейнер
            document.body.removeChild(tempContainer);
        }
    };

    // === Добавление картинки ===
    const handleAddImage = (imgSrc) => {
        const newImg = {
            id: Date.now(),
            src: imgSrc,
            x: 200 + Math.random() * 150,
            y: 150 + Math.random() * 150,
            width: 150,
            height: 150,
        };
        setImages((prev) => [...prev, newImg]);
    };

    // === Загрузка файлов ===
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => handleAddImage(ev.target.result);
            reader.readAsDataURL(file);
        });
    };

    // === Вставка из буфера обмена ===
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (ev) => handleAddImage(ev.target.result);
                    reader.readAsDataURL(file);
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    // === Контекстное меню ===
    const handleContextMenu = (e, id) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            targetId: id,
        });
    };

    const handleDeleteImage = () => {
        setImages((prev) => prev.filter((img) => img.id !== contextMenu.targetId));
        setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
    };

    useEffect(() => {
        const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0, targetId: null });
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // === Перемещение и ресайз ===
    const bringToFront = (id) => {
        setImages((prev) => {
            const idx = prev.findIndex((p) => p.id === id);
            if (idx === -1) return prev;
            const item = prev[idx];
            const rest = prev.filter((p) => p.id !== id);
            return [...rest, item];
        });
    };

    const handlePointerDownImage = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        bringToFront(id);
        const workspaceRect = workspaceRef.current.getBoundingClientRect();
        const elRect = e.currentTarget.getBoundingClientRect();
        draggingRef.current = {
            id,
            offsetX: e.clientX - elRect.left,
            offsetY: e.clientY - elRect.top,
            workspaceRect,
        };
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { }
    };

    const handlePointerDownResize = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        bringToFront(id);
        const workspaceRect = workspaceRef.current.getBoundingClientRect();
        const img = images.find((x) => x.id === id);
        if (!img) return;
        resizingRef.current = {
            id,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: img.width,
            startHeight: img.height,
            workspaceRect,
        };
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { }
    };

    useEffect(() => {
        const onPointerMove = (e) => {
            if (draggingRef.current) {
                const { id, offsetX, offsetY, workspaceRect } = draggingRef.current;
                const nextX = e.clientX - workspaceRect.left - offsetX;
                const nextY = e.clientY - workspaceRect.top - offsetY;
                setImages((prev) =>
                    prev.map((img) => (img.id === id ? { ...img, x: nextX, y: nextY } : img))
                );
            }
            if (resizingRef.current) {
                const { id, startX, startY, startWidth, startHeight } = resizingRef.current;
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                setImages((prev) =>
                    prev.map((img) =>
                        img.id === id
                            ? {
                                ...img,
                                width: Math.max(20, startWidth + deltaX),
                                height: Math.max(20, startHeight + deltaY),
                            }
                            : img
                    )
                );
            }
        };

        const onPointerUp = () => {
            draggingRef.current = null;
            resizingRef.current = null;
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, []);

    return (
        <div className="main-container">
            <aside className="sidebar">
                <label className="upload-btn">
                    📁 Загрузить
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </label>
            </aside>

            <div className="content">
                <nav className="top-nav">
                    <div className="logo">Stylo</div>

                    <div className="search-wrapper">
                        <input
                            type="text"
                            placeholder="🔍 Поиск изображений..."
                            className="search-input"
                            value={query}
                            onChange={handleSearchChange}
                        />
                        {searchResults.length > 0 && (
                            <div className="search-panel">
                                {searchResults.map((res) => (
                                    <img
                                        key={res.id}
                                        src={res.src}
                                        alt=""
                                        className="search-result-img"
                                        onClick={() => handleAddImage(res.src)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="user-section">
                        <div className="settings">⚙️</div>
                        <div className="user">
                            <img src="https://picsum.photos/40" alt="avatar" className="avatar" />
                            <span>John</span>
                        </div>
                    </div>
                </nav>

                <div className="editor-area" ref={workspaceRef}>
                    {/* Манекен */}
                    <img
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOPr51KmVupb-yWDvSU98FVVyoM_5peYepxw&s"
                        alt="mannequin"
                        className="mannequin"
                    />

                    {/* Картинки */}
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className="image-wrapper plain-image"
                            style={{
                                left: img.x,
                                top: img.y,
                                width: img.width,
                                height: img.height,
                            }}
                            onContextMenu={(e) => handleContextMenu(e, img.id)}
                        >
                            <img
                                src={img.src}
                                alt=""
                                className="draggable-img"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onPointerDown={(e) => handlePointerDownImage(e, img.id)}
                                draggable={false}
                            />
                            <div
                                className="resize-handle"
                                onPointerDown={(e) => handlePointerDownResize(e, img.id)}
                            />
                        </div>
                    ))}

                    <button className="save-btn" onClick={handleSaveLook}>💾 Save look</button>
                </div>
            </div>

            {/* === Контекстное меню === */}
            {contextMenu.visible && (
                <div
                    className="context-menu"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        background: '#222',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        zIndex: 9999,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        userSelect: 'none',
                    }}
                    onClick={handleDeleteImage}
                >
                    🗑 Удалить
                </div>
            )}
        </div>
    );
};

export default MainComponent;
