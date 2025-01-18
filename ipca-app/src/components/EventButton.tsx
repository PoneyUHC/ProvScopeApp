
import { Component, RefObject } from 'react';
import GraphPanel from './GraphPanel';


interface EventButtonProps {
    className?: string;
    event: any;
    id: number;
    onClick: (id: number) => void;
}


class EventButton extends Component<EventButtonProps> {

    constructor(props: EventButtonProps) {
        super(props);
    }

    render() {

        const {className, event, id} = this.props;

        return (
            <button 
                onClick={(event) => this.props.onClick(id)}
                className={className}
            > 
                ${event.description} 
            </button>
        );
    }
}

export default EventButton;