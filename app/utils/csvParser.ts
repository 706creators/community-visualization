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
      const initiatorsStr = row['发起人姓名'] || row['initiators'] || '';
      const participantsStr = row['参与人姓名'] || row['participants'] || '';
      const topic = row['活动主题'] || row['topic'] || '';
      const venue = row['活动场地'] || row['venue'] || '';
      const time = row['活动时间'] || row['time'] || '';

      if (initiatorsStr && participantsStr && topic && venue) {
        // 解析发起人列表（支持分号或逗号分隔）
        const initiators = initiatorsStr.split(/[;,]/).map(name => name.trim()).filter(name => name);
        // 解析参与人列表（支持分号或逗号分隔）
        const participants = participantsStr.split(/[;,]/).map(name => name.trim()).filter(name => name);

        // 创建事件和场地节点ID
        const eventId = `event:${topic}@${time}`;
        const spaceId = `space:${venue}`;

        // 添加发起人节点
        initiators.forEach(initiator => {
          const initiatorId = `member:${initiator}`;
          if (!nodes.has(initiatorId)) {
            nodes.set(initiatorId, {
              id: initiatorId,
              type: "member",
              name: initiator,
              time: null,
            });
          }
        });

        // 添加参与人节点
        participants.forEach(participant => {
          const participantId = `member:${participant}`;
          if (!nodes.has(participantId)) {
            nodes.set(participantId, {
              id: participantId,
              type: "member",
              name: participant,
              time: null,
            });
          }
        });

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

        // 添加边的关系（只保留主要的有向关系）
        // 发起人 -> 活动 (initiates)
        initiators.forEach(initiator => {
          const initiatorId = `member:${initiator}`;
          edges.push({
            source: initiatorId,
            target: eventId,
            relationship: "initiates",
            value: 1,
          });
        });

        // 活动 -> 参与人 (participates)
        participants.forEach(participant => {
          const participantId = `member:${participant}`;
          edges.push({
            source: eventId,
            target: participantId,
            relationship: "participates",
            value: 1,
          });
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
Alice;Bob,Oscar;Rita,Intro to Blockchain,Library Room 3,2025-09-24 09:45
Charlie,Quinn;Laura;Mike,Tauri for Desktop Apps,Cafe 706,2025-09-17 19:30
Fiona;George,Laura,Creative Coding Jam,Community Hall,2025-10-14 19:30
Hannah,Nina;Paula,Web3 and Society,Cafe 706,2025-10-02 09:45
Diana;Ethan,Kevin;Judy,Co-Learning Kickoff,Online Zoom Room,2025-09-24 15:15
Bob,Oscar;Rita,Holacracy in Startups,Community Hall,2025-10-11 19:00
Alice;Charlie,Nina;Quinn,Global Hackathon Trends,Library Room 3,2025-09-18 16:45
Fiona,Paula;Kevin,Creative Coding Jam,Makerspace A1,2025-09-28 11:45
George;Hannah,Oscar;Laura,DIY Hardware Wallet,Cafe 706,2025-10-11 13:15
Diana,Mike;Judy,Crypto in Argentina,Online Zoom Room,2025-10-05 14:30`;

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