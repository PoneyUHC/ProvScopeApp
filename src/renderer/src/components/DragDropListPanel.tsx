
import { Droppable, Draggable, DragDropContext } from "@hello-pangea/dnd";


const grid = 5;

const getItemStyle = (isDragging, draggableStyle) => ({

  ...draggableStyle,
  
  position: isDragging ? 'fixed' : 'relative',

  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,
  background: isDragging ? "lightblue" : "white",

  

});


const getListStyle = isDraggingOver => ({
  background: "lightgrey",
  position: 'relative',
  maxHeight: '300px',
  overflowY: 'auto'

});


const reorder = (list: string[], startIndex: number, endIndex: number) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
};


interface DragDropListProps {
    itemNames: string[],
    onListChanged: (result: any) => void
    onRemove: (name: string, index: number) => void
}


const DragDropListPanel: React.FC<DragDropListProps> = ({itemNames, onListChanged, onRemove}) => {

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const newOrder = reorder(
            itemNames,
            result.source.index,
            result.destination.index
        );

        onListChanged(newOrder);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable" >
            {(provided, snapshot) => (
                <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={getListStyle(snapshot.isDraggingOver)}
                >
                    {itemNames.map((itemName, index) => (
                        <Draggable key={itemName} draggableId={itemName} index={index}>
                            {(provided, snapshot) => (
                                <div 
                                    ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                    style={{ 
                                        ...getItemStyle(snapshot.isDragging,provided.draggableProps.style),
                                        display: 'flex', 
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div>{itemName}</div>
                                    
                                    <button
                                        onClick={() => onRemove(itemName, index)}
                                        style={{
                                            color: 'grey',
                                            cursor: 'pointer',
                                            marginLeft: 10,
                                            fontWeight: 'bold',
                                            fontSize: '20px',
                                        }}
                                    >
                                        X
                                    </button>
                                </div>
                            )}
                        </Draggable>
                    ))}

                    {provided.placeholder}
                </div>
            )}
            </Droppable>
        </DragDropContext>
  );
}

export default DragDropListPanel;