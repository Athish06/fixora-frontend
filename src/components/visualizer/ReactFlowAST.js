import React, { useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { AlertTriangle, Code, PlayCircle } from 'lucide-react';
import { Badge } from '../ui/badge';

// DAGRE layout setup
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 260;
const nodeHeight = 100;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      // Shift to center
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
    return newNode;
  });

  return { nodes: newNodes, edges };
};

// Custom Node Component
const CustomASTNode = ({ data }) => {
  const { label, type, is_sink, category, note } = data;

  let borderColor = 'border-border/50';
  let bgColor = 'bg-card';
  let icon = <Code className="w-4 h-4 text-muted-foreground/60" />;

  if (is_sink) {
    if (category === 'Name Match' || category === 'Import Resolved' || category === 'Builtin') {
      borderColor = 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
      bgColor = 'bg-red-500/10';
      icon = <AlertTriangle className="w-4 h-4 text-red-500" />;
    } else {
      borderColor = 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)]';
      bgColor = 'bg-orange-500/10';
      icon = <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  } else if (type === 'Call') {
    borderColor = 'border-blue-500/50';
    bgColor = 'bg-blue-500/5';
    icon = <PlayCircle className="w-4 h-4 text-blue-500" />;
  }

  return (
    <div
      className={`min-w-[200px] max-w-[280px] p-3 rounded-lg border ${borderColor} ${bgColor} backdrop-blur-sm transition-all`}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground bg-black/40">
          {type}
        </Badge>
      </div>
      <div className="text-sm font-semibold text-primary font-mono truncate" title={label}>
        {label}
      </div>
      {note && (
        <p className="text-[10px] text-muted-foreground mt-2 leading-tight line-clamp-3" title={note}>
          {note}
        </p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  );
};

const nodeTypes = {
  astNode: CustomASTNode,
};

const ReactFlowAST = ({ treeData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!treeData) return;

    const initialNodes = [];
    const initialEdges = [];

    // Recursive function to flatten the tree into nodes and edges
    const flattenTree = (node, parentId = null) => {
      if (!node) return;

      const nodeId = node.id;
      
      initialNodes.push({
        id: nodeId,
        type: 'astNode',
        data: {
          label: node.label,
          type: node.type,
          is_sink: node.is_sink,
          confidence: node.confidence,
          category: node.category,
          note: node.note,
        },
        position: { x: 0, y: 0 }, // Will be set by dagre
      });

      if (parentId) {
        initialEdges.push({
          id: `e-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
          animated: node.is_sink, // Animate paths leading to sinks
          style: { stroke: node.is_sink ? '#ef4444' : '#64748b' },
        });
      }

      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => flattenTree(child, nodeId));
      }
    };

    flattenTree(treeData);

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [treeData, setNodes, setEdges]);

  return (
    <div className="w-full h-full border border-border/50 rounded-xl overflow-hidden bg-black/40">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        attributionPosition="bottom-right"
      >
        <Background color="#333" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default ReactFlowAST;
