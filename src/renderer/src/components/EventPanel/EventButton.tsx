
interface EventButtonProps {
    className?: string;
    content: string
    onLeftClick: (event: React.MouseEvent) => void;
    onRightClick: (event: React.MouseEvent) => void;
}


const EventButton: React.FC<EventButtonProps> = ({ className, content, onLeftClick, onRightClick }) => {

    return (
        <button 
            onClick={(event) => onLeftClick(event)}
            onContextMenu={(event) => onRightClick(event)}
            className={`font-mono ${className}`}
        > 
            {content}
        </button>
    );

}


export default EventButton;