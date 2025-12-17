import { useState, useRef, useEffect } from "react";
import "./AvatarMenu.css";
export default function AvatarMenu() {
    const [isOpen, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Добавим console.log для отладки
    console.log("AvatarMenu rendered, isOpen:", isOpen);

    return (
        <div className="header_avatar" ref={menuRef}>
            <img
                src="https://picsum.photos/40"
                alt="avatar"
                className="avatar_but"
                onClick={() => setOpen(!isOpen)}
            />

            {isOpen && (
                <nav className="avatar_menu">
                    <ul className="avatar_list">
                        <li className="avatar_list_item">Settings</li>
                        <li className="avatar_list_item">Change account</li>
                        <li className="avatar_list_item">Support</li>
                        <li className="avatar_list_item">Exit</li>
                    </ul>
                </nav>
            )}
        </div>
    );
}