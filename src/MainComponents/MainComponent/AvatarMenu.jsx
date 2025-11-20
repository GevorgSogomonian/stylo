import { useState, useRef, useEffect } from "react";
import "./AvatarMenu.css";

export default function AvatarMenu() {
    const [isOpen, setOpen] = useState(false);
    const menuRef = useRef(null);

    // Закрытие меню при клике вне
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="header_avatar" ref={menuRef}>
            <img
                src="https://picsum.photos/40"
                alt="avatar"
                className="avatar_but"
                onClick={() => setOpen((prev) => !prev)}
            />

            <nav className={`avatar_menu ${isOpen ? "active" : ""}`}>
                <ul className="avatar_list">
                    <li className="avatar_list_item">Settings</li>
                    <li className="avatar_list_item">Change account</li>
                    <li className="avatar_list_item">Support</li>
                    <li className="avatar_list_item">Exit</li>
                </ul>
            </nav>
        </div>
    );
}
