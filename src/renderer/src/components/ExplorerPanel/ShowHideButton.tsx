
import VisibleIcon from '@renderer/assets/visible.svg';
import HiddenIcon from '@renderer/assets/hidden.svg';


interface ShowHideButtonProps {
    content: string;
    onToggle: () => void;
    onClick: (node: string) => void;
    selected: boolean;
    visible: boolean;
}


const ShowHideButton: React.FC<ShowHideButtonProps> = ({ content, onToggle, onClick, selected, visible }) => {

    const icon = visible ? VisibleIcon : HiddenIcon;
    const borderStyle = selected ?
        "border-4 border-red-600 " : 
        "border-t border-black -mt-px";


    return (
        <div className={`flex ${borderStyle}`}>
            <button key={1}
                className="flex-1 border-r border-black"
                onClick={() => onClick(content)}
            >
                {content}
            </button>
            <button key={2}
                className="w-10"  
                onClick={() => onToggle()}
            >
                <img src={icon} className={visible ? "" : "opacity-20"}/>
            </button> 
        </div>
        
    );
}

export default ShowHideButton;