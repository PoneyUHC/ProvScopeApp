
import React, { useContext, useEffect, useState } from "react";
import {
  ExecutionTraceContext,
  ExecutionTraceContextType,
} from "@renderer/components/TraceBrowserTool/ExecutionTraceProvider";

import EventPatternPanel from "@renderer/components/Causality/EventPatternPanel";
import CausalPropertyPanel from "@renderer/components/Causality/CausalPropertyPanel";

import { EventPattern } from "@common/Provenance/IntraProcess/EventPattern";

export interface CausalityViewProps {
  initialPatternCode?: string;
  initialPatternName?: string;
  initialPropertyCode?: string;
  initialPropertyName?: string;
  onReady: () => void;
}

export const CausalityView: React.FC<CausalityViewProps> = ({
  initialPatternCode,
  initialPatternName,
  initialPropertyCode,
  initialPropertyName,
  onReady,
}) => {
  const { executionTrace } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);
  // declare hooks unconditionally to avoid changing hook order when context is null
  const [eventPatterns, setEventPatterns] = useState<EventPattern[]>([]);
  
  if (!executionTrace) return null;
  
  
  useEffect(() => {
    console.log('[CausalityView] onReady');
    onReady();
  }, []);


  return (
    <div className="flex h-full w-full gap-3 p-4 overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <EventPatternPanel
            initialCode={initialPatternCode}
            initialName={initialPatternName}
            patterns={eventPatterns}
            onChange={setEventPatterns}
          />
        </div>
      </div>

      <div className="w-1/2 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <CausalPropertyPanel
            initialCode={initialPropertyCode}
            initialName={initialPropertyName}
            eventPatterns={eventPatterns}
          />
        </div>
      </div>
    </div>
  );
};

export default CausalityView;
