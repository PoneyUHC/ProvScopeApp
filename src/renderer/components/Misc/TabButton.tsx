
interface TabButtonProps {
    mainClick: () => void;
    deleteClick: (index) => void;
    index: number;
    className?: string | null;
    text : string;
    isSelected?: boolean;
    selectedButtonStyle: string;
    notSelectedButtonStyle: string;
};

// Main button with 2 options : select or delete this workspace
const TabButton : React.FC<TabButtonProps> = ({mainClick, deleteClick, index, className, text, isSelected, selectedButtonStyle, notSelectedButtonStyle}) => {  

    const buttonStyle = isSelected ? selectedButtonStyle : notSelectedButtonStyle;

    return (
        <div className ={`${className} ${buttonStyle}`} >

            <button className="flex-1 text-left truncate" onClick={mainClick}>
                {text}
            </button>
            
            <button className="text-black hover:text-red-600 ml-2" onClick={ () => deleteClick(index)} >
                x
            </button>

        </div>
    )
}

export default TabButton;