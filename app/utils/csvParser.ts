import { GraphData, Node, Edge } from '../types/graph';

export const parseCSV = (csvText: string): GraphData => {
  try {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    const nodes = new Map<string, Node>();
    const edges: Edge[] = [];

    // 解析每一行数据
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: { [key: string]: string } = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      // 根据CSV格式创建节点和边
      // CSV格式：发起人姓名,参与人姓名,活动主题,活动场地,活动时间
      const initiator = row['发起人姓名'] || row['initiator'] || '';
      const participant = row['参与人姓名'] || row['participant'] || '';
      const topic = row['活动主题'] || row['topic'] || '';
      const venue = row['活动场地'] || row['venue'] || '';
      const time = row['活动时间'] || row['time'] || '';

      if (initiator && participant && topic && venue) {
        // 创建节点ID（参考 graph_model.py）
        const initiatorId = `member:${initiator}`;
        const participantId = `member:${participant}`;
        const eventId = `event:${topic}@${time}`;
        const spaceId = `space:${venue}`;

        // 添加发起人节点
        if (!nodes.has(initiatorId)) {
          nodes.set(initiatorId, {
            id: initiatorId,
            type: "member",
            name: initiator,
            time: null,
          });
        }

        // 添加参与人节点
        if (!nodes.has(participantId)) {
          nodes.set(participantId, {
            id: participantId,
            type: "member",
            name: participant,
            time: null,
          });
        }

        // 添加活动节点
        if (!nodes.has(eventId)) {
          nodes.set(eventId, {
            id: eventId,
            type: "event",
            name: topic,
            time: time,
          });
        }

        // 添加场地节点
        if (!nodes.has(spaceId)) {
          nodes.set(spaceId, {
            id: spaceId,
            type: "space",
            name: venue,
            time: null,
          });
        }

        // 添加边（参考 graph_model.py 的关系）
        // 发起人 -> 活动 (initiates)
        edges.push({
          source: initiatorId,
          target: eventId,
          relationship: "initiates",
          value: 1,
        });

        // 活动 -> 参与人 (participates)
        edges.push({
          source: eventId,
          target: participantId,
          relationship: "participates",
          value: 1,
        });

        // 场地 -> 活动 (hosts)
        edges.push({
          source: spaceId,
          target: eventId,
          relationship: "hosts",
          value: 1,
        });
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: edges,
    };
  } catch (error) {
    throw new Error(`CSV解析错误: ${(error as Error).message}`);
  }
};

export const downloadSampleCSV = () => {
  const sampleCSV = `发起人姓名,参与人姓名,活动主题,活动场地,活动时间
Alice,Oscar,Intro to Blockchain,Library Room 3,2025-09-24 09:45
Charlie,Quinn,Tauri for Desktop Apps,Cafe 706,2025-09-17 19:30
Fiona,Laura,Creative Coding Jam,Community Hall,2025-10-14 19:30
George,Rita,Web3 and Society,Cafe 706,2025-10-02 09:45
Hannah,Nina,Co-Learning Kickoff,Online Zoom Room,2025-09-24 15:15
Bob,Judy,Holacracy in Startups,Community Hall,2025-10-11 19:00
Ethan,Kevin,Holacracy in Startups,Community Hall,2025-09-26 17:00
Alice,Nina,Global Hackathon Trends,Library Room 3,2025-09-18 16:45
Diana,Paula,Creative Coding Jam,Library Room 3,2025-09-28 11:45
Hannah,Oscar,Tauri for Desktop Apps,Cafe 706,2025-10-11 13:15`;

  const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_community_events.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};