
import { useState } from 'react';

const SlidingPanel = ({children}) => {
    const [isOpen, setIsOpen] = useState(false);
    const switchOpen = () => setIsOpen(!isOpen);
    const width = 360;

    return(
        <>
            <div
                onClick = {switchOpen}
                style={{ position: "fixed", top: "18%", right: isOpen ? width : 0, transform: "translateY(-50%)",  cursor: "pointer", backgroundColor: "grey", color: "white", padding: "10px",
                        borderTopLeftRadius: "5px", borderBottomLeftRadius: "5px", userSelect: "none", zIndex: 1001,
                }}
            >
                {isOpen ? ">" : "<"}
            </div>
            <div
                style={{ position: "fixed", top: "15%", right: 0, backgroundColor: "lightgrey", boxShadow: "-2px 0 5px rgba(0, 0, 0, 0.3)", transform: isOpen ? "translateX(0)" : `translateX(${width}px)`,
                        transition: "transform 0.3s ease-in-out", overflowY: "auto"
                }}
            >
                {children}
            </div>
        </>
    );
}

export default SlidingPanel;