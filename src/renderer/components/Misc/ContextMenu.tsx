
import { useEffect } from 'react';
import { createPortal } from 'react-dom';


export interface ContextMenuItem {
    label: string;
    onClick: () => void;
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}


/** A small floating menu anchored at (x, y). Closes on outside click or Escape. */
const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {

    useEffect(() => {
        const handleClose = () => onClose();
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        // Defer so the click that opened the menu doesn't immediately close it.
        const id = window.setTimeout(() => {
            window.addEventListener('click', handleClose);
            window.addEventListener('contextmenu', handleClose);
            window.addEventListener('keydown', handleKey);
        }, 0);
        return () => {
            window.clearTimeout(id);
            window.removeEventListener('click', handleClose);
            window.removeEventListener('contextmenu', handleClose);
            window.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    return createPortal(
        <ul
            className="fixed z-50 min-w-40 bg-white border border-black rounded shadow-lg py-1"
            style={{ left: x, top: y }}
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item) => (
                <li key={item.label}>
                    <button
                        className="w-full text-left px-3 py-1 hover:bg-gray-200"
                        onClick={() => { item.onClick(); onClose(); }}
                    >
                        {item.label}
                    </button>
                </li>
            ))}
        </ul>,
        document.body
    );
}

export default ContextMenu;
