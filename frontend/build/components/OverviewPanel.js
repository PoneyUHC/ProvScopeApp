import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import VisibilityButton from './VisibilityButton';
class OverviewPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            graphLoaded: false,
            selectedNode: null
        };
    }
    onGraphLoaded() {
        this.setState({ graphLoaded: true });
    }
    selectNode(node) {
        if (this.state.selectedNode == node) {
            return;
        }
        this.setState({ selectedNode: node }, () => {
            this.props.graphPanelRef.current?.highlightNode(node);
        });
    }
    getNodeGroupsButtons() {
        const nodesByGroup = this.props.graphPanelRef.current?.getNodesByGroup();
        if (!nodesByGroup) {
            return _jsx("div", { className: 'font-mono', children: "No nodes" });
        }
        const onToggle = (node) => {
            this.props.graphPanelRef.current?.toggleNodeVisibility(node);
        };
        const onSelect = (node) => {
            this.selectNode(node);
        };
        return (Array.from(nodesByGroup).map((pair) => {
            return (_jsxs("div", { className: 'mb-5 rounded-t-2xl overflow-hidden border border-black flex flex-col', children: [_jsx("h1", { className: 'text-xl font-semibold pl-3 bg-gray-300 flex-grow', children: pair[0] }), pair[1].map((node) => {
                        return (_jsx(VisibilityButton, { content: node, onClick: () => onSelect(node), onToggle: onToggle, selected: this.state.selectedNode == node }));
                    }), _jsx("div", { className: 'bg-gray-300 flex-grow border-t border-black', children: "\u00A0" })] }));
        }));
    }
    //TODO: link the selected node to the graph panel highlight
    render() {
        const { graphLoaded } = this.state;
        if (!graphLoaded) {
            return _jsx("div", { className: `flex items-center justify-center font-mono ${this.props.className}`, children: "Load a model to display its elements" });
        }
        const buttons = this.getNodeGroupsButtons();
        return (_jsx("div", { className: `${this.props.className} overflow-auto`, children: buttons }));
    }
}
export default OverviewPanel;
