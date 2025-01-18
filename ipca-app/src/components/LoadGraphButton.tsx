
import React, { Component } from 'react';

interface LoadGraphButtonProps {
    className?: string;
    onFileLoad?: (fileContent: string) => void;
}

interface LoadGraphButtonState {
    currentFileName: string | null;
}


class LoadGraphPanel extends Component<LoadGraphButtonProps, LoadGraphButtonState> {

    fileInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: LoadGraphButtonProps) {
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
                const fileContent = e.target?.result as string;
                this.props.onFileLoad?.(fileContent);
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
            <div className={`flex items-center ${this.props.className}`}>
                <input
                    className='hidden'
                    type="file"
                    ref={this.fileInputRef}
                    onChange={this.handleFileChange}
                />
                <div className='w-auto h-2/6 flex items-center justify-center border-2 border-black ml-20 pl-5 pr-5'>
                    {currentFileName ? currentFileName : "No file selected"}
                </div>
                <button 
                    onClick={this.handleButtonClick} 
                    className="w-1/6 h-5/6 border-2 border-black ml-10">
                    Load Graph
                </button>
            </div>
        );
    }
}

export default LoadGraphPanel;