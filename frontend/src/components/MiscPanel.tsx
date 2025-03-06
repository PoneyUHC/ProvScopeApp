
import React, { Component } from 'react';

interface MiscPanelProps {
    className?: string;
    onFileLoad: (filename: string, fileContent: string) => void;
    onExport: () => void;
}

interface MiscPanelState {
    currentFileName: string | null;
}


class MiscPanel extends Component<MiscPanelProps, MiscPanelState> {

    fileInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: MiscPanelProps) {
        super(props);
        this.fileInputRef = React.createRef();
        this.state = {
            currentFileName: null
        }
    }

    handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const filename = file.name;
                const fileContent = e.target?.result as string;
                this.props.onFileLoad?.(filename, fileContent);
            };
            reader.readAsText(file);

            this.setState({currentFileName: file.name})
        }
    };

    handleButtonClick = () => {
        this.fileInputRef.current?.click();
    };

    render() {

        const { currentFileName } = this.state;

        return (
            <div className={`flex items-center gap-10 ${this.props.className}`}>
                <input
                    className='hidden'
                    type="file"
                    ref={this.fileInputRef}
                    onChange={this.handleFileChange}
                />
                <div className='w-1/6 h-2/6 font-mono flex items-center justify-center border border-black ml-20 pl-5 pr-5'>
                    {currentFileName ? currentFileName : "No file selected"}
                </div>
                <button 
                    onClick={this.handleButtonClick} 
                    className="w-1/6 h-5/6 font-mono border-black border rounded-md cursor-pointer bg-[#e3e3e3] transition hover:bg-[#c7c7c7]"
                >
                    Load Graph
                </button>
                <button
                    onClick={(_) => this.props.onExport()}
                    className="w-1/6 h-5/6 font-mono border-black border rounded-md cursor-pointer bg-[#e3e3e3] transition hover:bg-[#c7c7c7] mr-10 ml-auto"
                >
                    Export current state
                </button>
            </div>
        );
    }
}

export default MiscPanel;