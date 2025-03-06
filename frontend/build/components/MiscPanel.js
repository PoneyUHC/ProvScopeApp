import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Component } from 'react';
class MiscPanel extends Component {
    constructor(props) {
        super(props);
        Object.defineProperty(this, "fileInputRef", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "handleFileChange", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (event) => {
                const file = event.target.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const filename = file.name;
                        const fileContent = e.target?.result;
                        this.props.onFileLoad?.(filename, fileContent);
                    };
                    reader.readAsText(file);
                    this.setState({ currentFileName: file.name });
                }
            }
        });
        Object.defineProperty(this, "handleButtonClick", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: () => {
                this.fileInputRef.current?.click();
            }
        });
        this.fileInputRef = React.createRef();
        this.state = {
            currentFileName: null
        };
    }
    render() {
        const { currentFileName } = this.state;
        return (_jsxs("div", { className: `flex items-center gap-10 ${this.props.className}`, children: [_jsx("input", { className: 'hidden', type: "file", ref: this.fileInputRef, onChange: this.handleFileChange }), _jsx("div", { className: 'w-1/6 h-2/6 font-mono flex items-center justify-center border border-black ml-20 pl-5 pr-5', children: currentFileName ? currentFileName : "No file selected" }), _jsx("button", { onClick: this.handleButtonClick, className: "w-1/6 h-5/6 font-mono border-black border rounded-md cursor-pointer bg-[#e3e3e3] transition hover:bg-[#c7c7c7]", children: "Load Graph" }), _jsx("button", { onClick: (_) => this.props.onExport(), className: "w-1/6 h-5/6 font-mono border-black border rounded-md cursor-pointer bg-[#e3e3e3] transition hover:bg-[#c7c7c7] mr-10 ml-auto", children: "Export current state" })] }));
    }
}
export default MiscPanel;
