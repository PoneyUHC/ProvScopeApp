
import React, { createRef, useContext } from 'react';
import { IPCTraceGraphContext, IPCTraceGraphContextType } from './IPCTraceGraphContext';

interface MiscPanelProps {
    className?: string;
    setIsGraphLoaded: (value: boolean) => void;
}


const MiscPanel: React.FC<MiscPanelProps> = ({ className, setIsGraphLoaded }) => {

    const { loadFile, exportTrace } = useContext<IPCTraceGraphContextType>(IPCTraceGraphContext);

    const fileInputRef = createRef<HTMLInputElement>();
    const [currentFileName, setCurrentFileName] = React.useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const filename = file.name;
                const fileContent = e.target?.result as string;
                loadFile(filename, fileContent);
            };

            reader.readAsText(file);
            setCurrentFileName(file.name)
            setIsGraphLoaded(true)
        }
    };


    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };
    

    return (
        <div className={`flex items-center gap-10 ${className}`}>
            <input
                className='hidden'
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <div className='w-1/6 h-2/6 font-mono flex items-center justify-center border border-black ml-20 pl-5 pr-5'>
                {currentFileName ? currentFileName : "No file selected"}
            </div>
            <button 
                onClick={handleButtonClick} 
                className="w-1/6 h-5/6 font-mono border-black border rounded-md cursor-pointer bg-[#e3e3e3] transition hover:bg-[#c7c7c7]"
            >
                Load Graph
            </button>
            <button
                onClick={(_e) => exportTrace()}
                className="w-1/6 h-5/6 font-mono border-black border rounded-md cursor-pointer bg-[#e3e3e3] transition hover:bg-[#c7c7c7] mr-10 ml-auto"
            >
                Export current state
            </button>
        </div>
    );
}


export default MiscPanel;