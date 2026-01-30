// CausalityView.tsx
import React, { useContext, useState } from "react";
import {
  ExecutionTraceContext,
  ExecutionTraceContextType,
} from "@renderer/components/TraceBrowserTool/ExecutionTraceProvider";

import EventPatternPanel, { NamedEventPattern } from "@renderer/components/Causality/EventPatternPanel";
import CausalPropertyPanel, { NamedCausalProperty } from "@renderer/components/Causality/CausalPropertyPanel";

type CausalityViewProps = {
  initialPatternCode?: string;
  initialPatternName?: string;
  initialPropertyCode?: string;
  initialPropertyName?: string;
};

export const CausalityView: React.FC<CausalityViewProps> = ({
  initialPatternCode,
  initialPatternName,
  initialPropertyCode,
  initialPropertyName,
}) => {
  const { executionTrace } = useContext<ExecutionTraceContextType>(ExecutionTraceContext);
  if (!executionTrace) return null;

  const [eventPatterns, setEventPatterns] = useState<NamedEventPattern[]>([]);
  const [causalProperties, setCausalProperties] = useState<NamedCausalProperty[]>([]);

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
            properties={causalProperties}
            onChange={setCausalProperties}
          />
        </div>
      </div>
    </div>
  );
};

export default CausalityView;
