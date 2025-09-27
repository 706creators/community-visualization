import { NextRequest } from 'next/server';
import type { GraphData, Node, Edge } from '../../types/graph';

// 定义类型接口
interface MemberParticipation {
  name: string;
  participation: number;
}

// API配置
const API_CONFIGS = {
  deepseek: {
    url: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-2.0-flash',
    apiKeyEnv: 'GEMINI_API_KEY',
  }
};

export async function POST(request: NextRequest) {
  try {
    const { message, graphData }: { message: string; graphData?: GraphData } = await request.json();

    // 获取AI提供商配置
    const provider = process.env.AI_PROVIDER || 'deepseek';
    const config = API_CONFIGS[provider as keyof typeof API_CONFIGS];
    
    if (!config) {
      throw new Error(`不支持的AI提供商: ${provider}`);
    }

    const apiKey = process.env[config.apiKeyEnv];
    if (!apiKey) {
      throw new Error(`未找到${provider}的API密钥，请检查环境变量${config.apiKeyEnv}`);
    }

    // 分析图数据，提取更详细的上下文信息
    let detailedContext = '';
    if (graphData && graphData.nodes && graphData.edges) {
      const nodes = graphData.nodes;
      const edges = graphData.edges;
      
      // 统计信息
      const memberNodes = nodes.filter((n: Node) => n.type === 'member');
      const eventNodes = nodes.filter((n: Node) => n.type === 'event');
      const spaceNodes = nodes.filter((n: Node) => n.type === 'space');
      
      // 活动分析
      const eventsBySpace = eventNodes.reduce((acc: Record<string, number>, event: Node) => {
        const spaceEdge = edges.find((e: Edge) => e.target === event.id && e.relationship === 'hosts');
        if (spaceEdge) {
          const space = nodes.find((n: Node) => n.id === spaceEdge.source);
          if (space) {
            acc[space.name] = (acc[space.name] || 0) + 1;
          }
        }
        return acc;
      }, {});
      
      // 成员参与度分析
      const memberParticipation: MemberParticipation[] = memberNodes.map((member: Node) => {
        const participateEdges = edges.filter((e: Edge) => 
          (e.source === member.id && e.relationship === 'initiates') ||
          (e.target === member.id && e.relationship === 'participates')
        );
        return {
          name: member.name,
          participation: participateEdges.length
        };
      }).sort((a: MemberParticipation, b: MemberParticipation) => b.participation - a.participation);

      // 时间分布分析
      const eventTimes = eventNodes
        .filter((e: Node) => e.time)
        .map((e: Node) => new Date(e.time!))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());
      
      detailedContext = `
详细数据分析：
- 节点总数: ${nodes.length} (成员: ${memberNodes.length}, 活动: ${eventNodes.length}, 场地: ${spaceNodes.length})
- 边总数: ${edges.length}
- 活动分布: ${Object.entries(eventsBySpace).map(([space, count]) => `${space}(${count}场)`).join(', ')}
- 最活跃成员: ${memberParticipation.slice(0, 3).map((m: MemberParticipation) => `${m.name}(${m.participation}次)`).join(', ')}
- 时间范围: ${eventTimes.length > 0 ? `${eventTimes[0].toLocaleDateString()} 至 ${eventTimes[eventTimes.length-1].toLocaleDateString()}` : '未知'}

具体数据样本：
成员: ${memberNodes.slice(0, 5).map((n: Node) => n.name).join(', ')}${memberNodes.length > 5 ? '等' : ''}
活动: ${eventNodes.slice(0, 3).map((n: Node) => n.name).join(', ')}${eventNodes.length > 3 ? '等' : ''}
场地: ${spaceNodes.map((n: Node) => n.name).join(', ')}`;
    } else {
      detailedContext = '当前没有上传图数据。请用户先上传CSV文件来分析社区网络。';
    }

    // 构建系统提示，包含详细的图数据上下文
    const systemPrompt = `你是一个专门分析社区网络图的AI助手。${detailedContext}

你的任务是：
1. 以"发起人（initiator）"作为社区链路的起点，追踪其发起事件带来的加入与激活过程。同时，识别"参与者（participant）"在社区中的角色：他们既是链路的承接者，也可能演化为新的发起人。
2. 基于上传的 CSV 数据（发起人、参与者、活动场地、活动时间），构建时序社区网络图谱，并校验数据质量，确保能还原发起人-参与者-场地-时间的关系。
3. 为发起人建立指标：直接招募的参与者数量、下游传播规模与深度、覆盖的场地与时间跨度。
4. 为参与者建立指标：参与次数（频率）、跨场地参与度、跨时间持续度、是否转化为新的发起人、在网络中的入度与中介中心性。
5. 可视化双重链路：  
   - **发起人链路**：起点 → 级联树（体现社区如何从少数发起人扩散）；  
   - **参与者网络**：基于参与频率和多重关系的网络（体现社区中哪些节点成为连接关键）。  
6. 分析社区的演化模式：哪些发起人最具传播力，哪些参与者通过频繁参与成为潜在核心，哪些场地和时间点对社区生长最关键。
7. 提出发展建议：  
   - 对高潜力发起人提供更多支持，推荐相关主题的活动合作；  
   - 对高频参与者设计激励与转化路径，使其成为新发起人；  
   - 优化活动场地与时间选择，提升整体活跃度。  
8. 回答用户关于网络结构、社区健康度、成员参与度与角色演化的提问，并提供清晰、可复现的指标解释。
9. 如果用户没有上传图数据，请提醒用户先上传CSV文件来分析社区网络。

请用中文回复，答案要专业、具体、有见解，精炼到位但不要太长不要答非所问。如果用户询问具体数据，请引用上述分析结果。`;

    const requestBody = {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      stream: true,
      max_tokens: 800,
      temperature: 0.7,
    };

    const requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    console.log('=== AI API 流式调用 ===');
    console.log('提供商:', provider);
    console.log('用户问题:', message);

    const response = await fetch(config.url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('API错误:', response.status, errorText);
      throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
    }

    // 创建可读流来处理SSE响应
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          const initData = JSON.stringify({
            type: 'init',
            provider: provider,
            model: config.model
          });
          controller.enqueue(encoder.encode(`data: ${initData}\n\n`));

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  const doneData = JSON.stringify({
                    type: 'done'
                  });
                  controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                    const content = parsed.choices[0].delta.content;
                    if (content) {
                      const chunkData = JSON.stringify({
                        type: 'content',
                        content: content
                      });
                      controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));
                    }
                  }
                } catch (parseError) {
                  console.warn('解析SSE数据失败:', parseError);
                }
              }
            }
          }
        } catch (error) {
          console.error('流处理错误:', error);
          const errorData = JSON.stringify({
            type: 'error',
            message: '流式响应处理失败'
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('AI API调用失败:', error);
    
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        const errorData = JSON.stringify({
          type: 'error',
          message: '抱歉，AI服务暂时不可用。请稍后再试。',
          provider: process.env.AI_PROVIDER || 'deepseek'
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      },
    });

    return new Response(errorStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}