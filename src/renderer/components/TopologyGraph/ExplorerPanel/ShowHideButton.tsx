
import VisibleIcon from '@renderer/assets/visible.svg';
import HiddenIcon from '@renderer/assets/hidden.svg';
import BinaryIcon from '@renderer/assets/binary.svg';


interface ShowHideButtonProps {
    content: string;
    onShow: () => void;
    onHide: () => void
    onClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    selected: boolean;
    visible: boolean;
    showBinaryIcon?: boolean;
}


const ShowHideButton: React.FC<ShowHideButtonProps> = ({ content, onShow, onHide, onClick, onContextMenu, selected, visible, showBinaryIcon }) => {

    const icon = visible ? VisibleIcon : HiddenIcon;
    const borderStyle = selected ?
        "border-4 border-red-600 " :
        "border-t border-black -mt-px";
    const handleClick = onClick ? onClick : () => {}


    return (
        <div className={`flex ${borderStyle}`} onContextMenu={onContextMenu}>
            <button key={1}
                className="flex-1 border-r border-black flex items-center justify-between gap-1 px-1"
                onClick={handleClick}
            >
                <span className="flex-1 text-left">{content}</span>
                {showBinaryIcon && <img src={BinaryIcon} className="w-5 h-5 shrink-0" title="Binary file set" />}
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