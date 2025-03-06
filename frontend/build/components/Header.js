import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import goldoIcon from '../assets/goldo_icon.png';
class Header extends Component {
    render() {
        return (_jsxs("div", { className: 'w-full h-24 bg-slate-200 border border-black border-opacity-20 shadow-md flex overflow-hidden pr-5 justify-between', children: [_jsx("p", { className: 'self-center ml-5 font-mono font-bold text-2xl', children: "IPC Analyzer App" }), _jsx("img", { src: goldoIcon, alt: "Logo", className: 'flex-shrink-0' })] }));
    }
}
export default Header;
