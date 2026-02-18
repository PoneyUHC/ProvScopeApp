
import { DirectedGraph } from "graphology"

import { Event } from "@common/types"
import { CausalProperty } from "./CausalProperty"
import { getProcessPriorEvents } from "@common/utils"


class IntraProcessDeducer {

    causalProperties: CausalProperty[]
    provenanceGraph: DirectedGraph


    constructor(provenanceGraph: DirectedGraph, causalProperties: CausalProperty[]) {
        this.causalProperties = causalProperties
        this.provenanceGraph = provenanceGraph
    }
    

    getSourceEvents(targetEvent: Event): { dependent: Event[], independent: Event[] } {

        let dependentSourceEvents: Event[] = []
        let independentSourceEvents: Event[] = []

        const targetMatchingProperties = this.causalProperties.filter(
            (property) => property.process === targetEvent.process && property.targetPattern.matches(targetEvent)
        )

        const dependentPropeties = targetMatchingProperties.filter(
            (property) => property.dependencyMode === "dependent"
        )

        const independentPropeties = targetMatchingProperties.filter(
            (property) => property.dependencyMode === "independent"
        )

        dependentSourceEvents = this.getMatchingSourceEvents(targetEvent, dependentPropeties)
        independentSourceEvents = this.getMatchingSourceEvents(targetEvent, independentPropeties)

        return { dependent: dependentSourceEvents, independent: independentSourceEvents }
    }


    getMatchingSourceEvents(targetEvent: Event, properties: CausalProperty[]): Event[] {

        const sourceEvents: Event[] = []
        const candidateEvents = getProcessPriorEvents(this.provenanceGraph, targetEvent)

        for (const event of candidateEvents) {
            for (const property of properties) {
                if (property.sourcePattern.matches(event) && property.evaluate(event, targetEvent)) {
                    sourceEvents.push(event)
                    break
                }
            }
        }

        return sourceEvents
    }


    addCausalProperty(property: CausalProperty): void {
        this.causalProperties.push(property)
    }

    removeCausalProperty(propertyName: string): void {
        this.causalProperties = this.causalProperties.filter((p) => p.name !== propertyName)
    }
}

export default IntraProcessDeducer