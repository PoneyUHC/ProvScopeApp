import { Component } from "react";

import VisibleIcon from '../assets/visible.svg';
import HiddenIcon from '../assets/hidden.svg';


interface VisibilityButtonProps {
    content: string;
    onToggle: (node: string) => void;
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

        return (
            <div className="flex border-t border-black items-center pl-2 -mt-px">
                <div className="h-full flex-1">
                    {content}
                </div>
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