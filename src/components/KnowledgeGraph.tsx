import React, { useMemo, useState } from "react";
import { WikiFileInfo } from "../types";
import { Network, ZoomIn, ZoomOut, RotateCcw, ExternalLink } from "lucide-react";

interface KnowledgeGraphProps {
  files: WikiFileInfo[];
  onSelectNode: (path: string) => void;
}

interface GraphNode {
  id: string;
  name: string;
  category: string;
  path: string;
  x: number;
  y: number;
  connections: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ files, onSelectNode }) => {
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Build nodes and edges
  const { nodes, edges } = useMemo(() => {
    const rawNodes: GraphNode[] = [];
    const rawEdges: GraphEdge[] = [];

    // Filter relevant files: entities, sources, syntheses
    const graphFiles = files.filter(
      (f) =>
        f.category === "wiki_entity" ||
        f.category === "raw_archive" ||
        f.category === "wiki_synthesis"
    );

    const count = graphFiles.length || 1;
    const centerX = 380;
    const centerY = 260;
    const radius = Math.min(centerX, centerY) - 80;

    graphFiles.forEach((file, index) => {
      const angle = (index / count) * 2 * Math.PI;
      const baseName = file.name.replace(".md", "");
      rawNodes.push({
        id: baseName,
        name: baseName,
        category: file.category,
        path: file.path,
        x: centerX + radius * Math.cos(angle) + (Math.random() * 20 - 10),
        y: centerY + radius * Math.sin(angle) + (Math.random() * 20 - 10),
        connections: 0,
      });
    });

    // Extract links between nodes
    graphFiles.forEach((file) => {
      if (file.content) {
        const sourceName = file.name.replace(".md", "");
        const matches = file.content.match(/\[\[(.*?)\]\]/g) || [];
        matches.forEach((m) => {
          const target = m.replace(/\[\[|\]\]/g, "").trim();
          if (rawNodes.some((n) => n.id === target) && target !== sourceName) {
            rawEdges.push({ source: sourceName, target });
            const sNode = rawNodes.find((n) => n.id === sourceName);
            const tNode = rawNodes.find((n) => n.id === target);
            if (sNode) sNode.connections++;
            if (tNode) tNode.connections++;
          }
        });
      }
    });

    return { nodes: rawNodes, edges: rawEdges };
  }, [files]);

  return (
    <div className="flex flex-col h-full bg-[#141418] rounded-lg border border-[#2D2D33] overflow-hidden shadow-lg">
      {/* Graph Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1A1A20] border-b border-[#2D2D33] text-xs font-mono">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-[#818CF8]" />
          <span className="font-bold text-white uppercase tracking-wider">
            PERSISTENT KNOWLEDGE GRAPH (双向图谱)
          </span>
          <span className="high-density-token font-mono text-[10px]">
            {nodes.length} NODES · {edges.length} EDGES
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#818CF8] inline-block shadow-[0_0_6px_#818CF8]"></span> ENTITIES
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] inline-block shadow-[0_0_6px_#A855F7]"></span> SYNTHESIS
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] inline-block shadow-[0_0_6px_#4ADE80]"></span> SOURCES
            </span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#141418] border border-[#2D2D33] p-0.5 rounded">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
              className="p-1 hover:bg-[#25252D] rounded text-[#94A3B8] hover:text-white cursor-pointer"
              title="放大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
              className="p-1 hover:bg-[#25252D] rounded text-[#94A3B8] hover:text-white cursor-pointer"
              title="缩小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:bg-[#25252D] rounded text-[#94A3B8] hover:text-white cursor-pointer"
              title="复位"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 relative overflow-hidden bg-[#0A0A0C] flex items-center justify-center select-none">
        <svg
          viewBox="0 0 760 520"
          className="w-full h-full max-h-[560px]"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#4B5563" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge, idx) => {
            const s = nodes.find((n) => n.id === edge.source);
            const t = nodes.find((n) => n.id === edge.target);
            if (!s || !t) return null;
            const isHovered =
              hoveredNode && (hoveredNode.id === s.id || hoveredNode.id === t.id);
            return (
              <line
                key={`edge-${idx}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={isHovered ? "#818CF8" : "#2D2D33"}
                strokeWidth={isHovered ? 2.5 : 1.2}
                strokeDasharray={edge.source.includes("综合") ? "4,4" : undefined}
                markerEnd="url(#arrow)"
                opacity={hoveredNode ? (isHovered ? 1 : 0.2) : 0.7}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            let fill = "#4F46E5";
            let stroke = "#818CF8";
            if (node.category === "raw_archive") {
              fill = "#065F46";
              stroke = "#4ADE80";
            }
            if (node.category === "wiki_synthesis") {
              fill = "#6B21A8";
              stroke = "#C084FC";
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectNode(node.path)}
              >
                <circle
                  r={isHovered ? 16 : 12}
                  fill={fill}
                  className="transition-all duration-200"
                  stroke={isHovered ? "#FFFFFF" : stroke}
                  strokeWidth={isHovered ? "3" : "2"}
                />
                <text
                  y={24}
                  textAnchor="middle"
                  className="text-[10px] font-mono font-medium fill-[#E2E8F0] pointer-events-none select-none"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hovered Node Tooltip / Quick Card */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-[#141418]/95 backdrop-blur-sm p-3 rounded-lg border border-[#2D2D33] shadow-xl text-xs max-w-xs space-y-1 font-mono">
            <div className="font-bold text-white flex items-center justify-between gap-2">
              <span>{hoveredNode.name}</span>
              <button
                onClick={() => onSelectNode(hoveredNode.path)}
                className="text-[#818CF8] hover:text-white flex items-center gap-0.5 text-[11px] cursor-pointer"
              >
                OPEN <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="text-[11px] text-[#94A3B8]">
              PATH: {hoveredNode.path}
            </div>
            <div className="text-[11px] text-slate-300">
              CONNECTIONS: {hoveredNode.connections}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
