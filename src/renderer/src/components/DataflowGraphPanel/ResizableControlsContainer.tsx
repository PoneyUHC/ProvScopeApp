import { useState } from 'react';
import { ControlsContainer } from '@react-sigma/core'
import { NumberSize, Resizable } from 're-resizable';
import { Direction } from 're-resizable/lib/resizer';



interface ResizableControlsContainerProps {
    children: React.ReactNode;
    defaultSize: { width: number, height: number },
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
}


const ResizableControlsContainer: React.FC<ResizableControlsContainerProps> = ({ defaultSize, children, position }) => {

    const [width, setWidth] = useState(defaultSize.width);
    const [height, setHeight] = useState(defaultSize.height);
    
    const handleOnResize = (_event: MouseEvent | TouchEvent, _direction: Direction, _elementRef: HTMLElement, delta: NumberSize): void  =>{
        setWidth(prevWidth => prevWidth + delta.width);
        setHeight(prevHeight => prevHeight + delta.height);
    };

    return (
        <ControlsContainer position={position}>
            <Resizable onResizeStop={handleOnResize} size={{ width, height }}>
                {children}
            </Resizable>
        </ControlsContainer>
    );
}


export default ResizableControlsContainer;