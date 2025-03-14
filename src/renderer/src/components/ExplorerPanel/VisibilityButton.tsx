import { Component, useEffect, useState } from "react";

import VisibleIcon from '@renderer/assets/visible.svg';
import HiddenIcon from '@renderer/assets/hidden.svg';


interface VisibilityButtonProps {
    content: string;
    onSetVisibility: (visible: boolean) => void;
    onClick: (node: string) => void;
    selected: boolean;
}


const VisibilityButton: React.FC<VisibilityButtonProps> = ({ content, onSetVisibility, onClick, selected }) => {

    const [visible, setVisible] = useState<boolean>(true);

    useEffect(() => {
        onSetVisibility(visible)
    }, [visible])

    const toggleVisibility = () => {
        setVisible(!visible)
    }

    const icon = visible ? VisibleIcon : HiddenIcon;
    const borderStyle = selected ?
        "border-4 border-red-600 " : 
        "border-t border-black -mt-px";


    return (
        <div className={`flex ${borderStyle}`}>
            <button 
                className="flex-1 border-r border-black"
                onClick={() => onClick(content)}
            >
                {content}
            </button>
            <button 
                className="w-10"  
                onClick={() => toggleVisibility()}
            >
                <img src={icon} className={visible ? "" : "opacity-20"}/>
            </button> 
        </div>
        
    );
}

export default VisibilityButton;