export interface Node {
  id: string;
  type: string;
  name: string;
  time: string | null;
}

export interface Edge {
  source: string;
  target: string;
  relationship: string;
  value: number;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}