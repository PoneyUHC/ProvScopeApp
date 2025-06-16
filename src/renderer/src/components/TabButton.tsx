
const baseButton = "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md"
const selectedButton = "bg-white border border-b-transparent border-black-200 text-black"
const notSelectedButton = "bg-gray-200 text-gray-600 border border-b-black-300 hover:bg-black-300"


// Main button with 2 options : select or delete this workspace
const TabButton = ({mainClick, deleteClick, index, className, ipcTraceGraph, currentWorkspace}) => {    
    return (
        <div
                className ={`${baseButton} ${ currentWorkspace === index ? selectedButton : notSelectedButton} ${className}`}
                onClick={mainClick}
            >
            <button className="flex-1 text-left truncate">
                {ipcTraceGraph.getTrace().filename.split('/').pop()}
            </button>

            
            <button
                className="text-black hover:text-red-600"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent the click from propagating to the button
                    deleteClick();
                }}
            >
                x
            </button>
        </div>
    )
}

export default TabButton;