import { Component } from "react";

import VisibleIcon from '@renderer/assets/visible.svg';
import HiddenIcon from '@renderer/assets/hidden.svg';


interface VisibilityButtonProps {
    content: string;
    onToggle: (node: string) => void;
    onClick: (node: string) => void;
    selected: boolean;
}


interface VisibilityButtonState {
    visible: boolean;
}


class VisibilityButton extends Component<VisibilityButtonProps, VisibilityButtonState> {

    constructor(props: VisibilityButtonProps) {
        super(props)
        this.state = {
            visible: true
        }
    }


    toggleVisibility() {

        const {content, onToggle} = this.props;

        onToggle(content)

        this.setState({visible: !this.state.visible})
    }


    render() {
        const {content} = this.props;

        const icon = this.state.visible ? VisibleIcon : HiddenIcon;
        const borderStyle = this.props.selected ?
            "border-4 border-red-600 " : 
            "border-t border-black -mt-px";


        return (
            <div className={`flex ${borderStyle}`}>
                <button 
                    className="flex-1 border-r border-black"
                    onClick={() => this.props.onClick(content)}
                >
                    {content}
                </button>
                <button 
                    className="w-10"  
                    onClick={() => this.toggleVisibility()}
                >
                    <img src={icon} className={this.state.visible ? "" : "opacity-20"}/>
                </button> 
            </div>
            
        );
    }

}

export default VisibilityButton;