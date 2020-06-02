import circlepack from "graphology-layout/circlepack";

export function layout_circlepack(graph) {
    circlepack.assign(graph, {hierarchyAttributes: ['community', 'degree']});
}
