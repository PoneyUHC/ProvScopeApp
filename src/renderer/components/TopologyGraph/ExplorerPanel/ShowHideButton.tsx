
import VisibleIcon from '@renderer/assets/visible.svg';
import HiddenIcon from '@renderer/assets/hidden.svg';


interface ShowHideButtonProps {
    content: string;
    onShow: () => void;
    onHide: () => void
    onClick?: () => void;
    selected: boolean;
    visible: boolean;
}


const ShowHideButton: React.FC<ShowHideButtonProps> = ({ content, onShow, onHide, onClick, selected, visible }) => {

    const icon = visible ? VisibleIcon : HiddenIcon;
    const borderStyle = selected ?
        "border-4 border-red-600 " : 
        "border-t border-black -mt-px";
    const handleClick = onClick ? onClick : () => {}


    return (
        <div className={`flex ${borderStyle}`}>
            <button key={1}
                className="flex-1 border-r border-black"
                onClick={handleClick}
            >
                {content}
            </button>
            <button key={2}
                className="w-10"  
                onClick={() => visible ? onHide() : onShow()}
            >
                <img src={icon} className={visible ? "" : "opacity-20"}/>
            </button> 
        </div>
        
    );
}

export default ShowHideButton;