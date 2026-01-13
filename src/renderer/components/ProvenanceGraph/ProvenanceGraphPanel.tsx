
import { useContext, useEffect, useRef, useState } from 'react';
import Sigma from 'sigma';

import { Allotment } from 'allotment';

import DragDropListPanel from '@renderer/components/Misc/DragDropListPanel';
import Error from '@renderer/components/Misc/Error';
import { Entity } from '@common/types';

import { ProvenanceGraphContextType, ProvenanceGraphContext } from './ProvenanceGraphProvider';
import { ExecutionTraceContext, ExecutionTraceContextType } from '../TraceBrowserTool/ExecutionTraceProvider';
import ProvenanceGraphSigma from './ProvenanceGraphSigma';


const provenanceGraphPanel: React.FC = () => {

    const {
        hiddenEntities: [hiddenEntities, hideEntity, showEntity],
    } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);

    const [sigma, setSigma] = useState<Sigma | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [orderedEntities, setOrderedEntities] = useState<Entity[]>([]);

    const hiddenEntitiesIndexLookup = useRef<Map<Entity, number>>(new Map());

    const { 
        provenanceGraph: provenanceGraph 
    } = useContext<ProvenanceGraphContextType>(ProvenanceGraphContext);
    
    if (!provenanceGraph) {
        return <Error message={"Provenance graph is not available."} />;
    }

    const previousHiddenEntities = useRef<Entity[]>(hiddenEntities);


    useEffect(() => {
        const newItems = provenanceGraph.trace.entities;
        setOrderedEntities(newItems);
        provenanceGraph.computeCoords(newItems);
    }, []);


    useEffect(() => {
        if (!sigma) return;
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
    }, [sigma]);


    useEffect(() => {
        if (!sigma) return;

        if (isDirty) {
            sigma.refresh();
            setIsDirty(false);
        }
    }, [isDirty])

    
    useEffect(() => {

        for (const entity of hiddenEntities) {
            if ( !previousHiddenEntities.current.includes(entity) ) {
                const index = orderedEntities.indexOf(entity);
                hiddenEntitiesIndexLookup.current.set(entity, index);
                const newList = [...orderedEntities];
                newList.splice(index, 1);
                hiddenEntitiesIndexLookup.current.set(entity, index);
                setOrderedEntities(newList);
            }
        }

        for (const entity of previousHiddenEntities.current) {
            if ( !hiddenEntities.includes(entity) ) {
                const index = hiddenEntitiesIndexLookup.current.get(entity) || 0;
                const safeIndex = Math.min(index, orderedEntities.length);
                const newList = [...orderedEntities.slice(0, safeIndex), entity, ...orderedEntities.slice(safeIndex)]; //we add the name at it's original place
                hiddenEntitiesIndexLookup.current.delete(entity);
                setOrderedEntities(newList);
            }
        }

        previousHiddenEntities.current = hiddenEntities;
        
    }, [hiddenEntities]);
    

    const onListChanged = (newOrder: Entity[]) => {
        provenanceGraph.computeCoords(newOrder);
        setOrderedEntities(newOrder);
    };


    const onRemove = (name: string, _index: number) => {
        const entity = provenanceGraph.trace.entities.find(e => e.getUUID() === name);
        hideEntity(entity!);
    }


    const onRestore = (name: Entity) => {
        showEntity(name);
    }


    const onDrag = () => {
        setIsDirty(true);
    }


    return (
        <div className={`flex items-center justify-center font-mono h-full`}>
             <Allotment onDragEnd={onDrag}>
                <Allotment.Pane minSize={200} preferredSize={"90%"} className="h-full w-full">

                    <ProvenanceGraphSigma 
                        setSigma={setSigma}
                        graph={provenanceGraph.graph}
                    />
                
                </Allotment.Pane>

                <Allotment.Pane minSize={200} preferredSize={"10%"}>

                    <Allotment vertical={true}>
                        <Allotment.Pane minSize={200} preferredSize={"70%"}>
                            <div className='overflow-auto h-full w-full bg-gray-100 rounded-lg shadow-md'>
                                <DragDropListPanel itemNames={orderedEntities.map(entity => entity.getUUID())} onListChanged={onListChanged} onRemove={onRemove} />
                            </div>
                        </Allotment.Pane>
                        <Allotment.Pane minSize={200} preferredSize={"30%"} className="w-full h-full overflow-auto">
                            <div className='overflow-auto h-full w-full bg-gray-100 rounded-lg shadow-md'>
                                {
                                    hiddenEntities.map((entity) => (
                                        <div className="w-full flex justify-between bg-[#f9f9f9] mb-2 rounded-md p-2" >
                                            {entity.getUUID()}
                                            <button className="bg-[#d3d3d3] text-black px-3 py-1 rounded hover:bg-[#bfbfbf] transition-colors duration-200" 
                                                    onClick={() => onRestore(entity)} 
                                            >
                                                👁
                                            </button>
                                        </div>
                                    ))
                                }
                            </div>
                        </Allotment.Pane>
                    </Allotment>
        
                </Allotment.Pane>
            </Allotment>
        </div>
    )
}

export default provenanceGraphPanel;

