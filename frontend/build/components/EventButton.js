import { jsx as _jsx } from "react/jsx-runtime";
import { Component } from 'react';
class EventButton extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        const { className, content } = this.props;
        return (_jsx("button", { onClick: (event) => this.props.onLeftClick(event), onContextMenu: (event) => this.props.onRightClick(event), className: `font-mono ${className}`, children: content }));
    }
}
export default EventButton;
