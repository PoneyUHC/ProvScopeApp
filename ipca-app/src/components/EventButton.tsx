
import { Component, RefObject } from 'react';


interface EventButtonProps {
    className?: string;
    content: string
    id: number;
    onLeftClick: (event: React.MouseEvent) => void;
    onRightClick: (event: React.MouseEvent) => void;
}


class EventButton extends Component<EventButtonProps> {

    constructor(props: EventButtonProps) {
        super(props);
    }

    render() {

        const {className, content} = this.props;

        return (
            <button 
                onClick={(event) => this.props.onLeftClick(event)}
                onContextMenu={(event) => this.props.onRightClick(event)}
                className={`font-mono ${className}`}
            > 
                {content}
            </button>
        );
    }
}

export default EventButton;