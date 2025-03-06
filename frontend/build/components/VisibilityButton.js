import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
import VisibleIcon from '../assets/visible.svg';
import HiddenIcon from '../assets/hidden.svg';
class VisibilityButton extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: true
        };
    }
    toggleVisibility() {
        const { content, onToggle } = this.props;
        onToggle(content);
        this.setState({ visible: !this.state.visible });
    }
    render() {
        const { content } = this.props;
        const icon = this.state.visible ? VisibleIcon : HiddenIcon;
        const borderStyle = this.props.selected ?
            "border-4 border-red-600 " :
            "border-t border-black -mt-px";
        return (_jsxs("div", { className: `flex ${borderStyle}`, children: [_jsx("button", { className: "flex-1 border-r border-black", onClick: () => this.props.onClick(content), children: content }), _jsx("button", { className: "w-10", onClick: () => this.toggleVisibility(), children: _jsx("img", { src: icon, className: this.state.visible ? "" : "opacity-20" }) })] }));
    }
}
export default VisibilityButton;
