
import Title from '@renderer/components/Misc/Title';
import ProvenanceGraphPanel from '@renderer/components/ProvenanceGraph/ProvenanceGraphPanel';
import ProvenanceGraph from '@common/ProvenanceGraph';
import { ProvenanceGraphProvider } from '@renderer/components/ProvenanceGraph/ProvenanceGraphProvider';


interface ProvenanceGraphViewProps {
    provenanceGraph: ProvenanceGraph
}


const ProvenanceGraphView: React.FC<ProvenanceGraphViewProps> = ({ provenanceGraph }) => {

    return (
        <>
            <Title content={"Provenance"} />
            <div className="w-full h-5/6 flex flex-col flex-grow overflow-auto pr-2 pl-2 pt-2">
                <ProvenanceGraphProvider provenanceGraph={provenanceGraph}>
                    <ProvenanceGraphPanel/>
                </ProvenanceGraphProvider>
            </div>
        </>
        
    );
}

export default ProvenanceGraphView;