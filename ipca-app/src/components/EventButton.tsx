
import { Component, RefObject } from 'react';
import GraphPanel from './GraphPanel';


interface EventButtonProps {
    className?: string;
    event: any;
    id: number;
    onLeftClick: (event: React.MouseEvent) => void;
    onRightClick: (event: React.MouseEvent) => void;
}


class EventButton extends Component<EventButtonProps> {

    constructor(props: EventButtonProps) {
        super(props);
    }

    render() {

        const {className, event, id} = this.props;

        return (
            <button 
                onClick={(event) => this.props.onLeftClick(event)}
                onContextMenu={(event) => this.props.onRightClick(event)}
                className={`font-mono ${className}`}
            > 
                {event.description} 
            </button>
        );
    }
}

export default EventButton;