"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon 
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatProps {
  graphData?: any; // 可以传入图数据供AI参考
}

export default function AIChat({ graphData }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '你好！我是你的AI助手，可以帮你分析社区网络图。有什么问题吗？',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 模拟AI回复（这里可以接入真实的AI API）
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // 基于图数据和用户消息生成回复
    const nodeCount = graphData?.nodes?.length || 0;
    const edgeCount = graphData?.edges?.length || 0;

    if (userMessage.includes('节点') || userMessage.includes('node')) {
      return `当前图中有 ${nodeCount} 个节点。这些节点包括成员、活动和场地。你想了解哪种类型的节点更多信息？`;
    }

    if (userMessage.includes('边') || userMessage.includes('关系') || userMessage.includes('edge')) {
      return `当前图中有 ${edgeCount} 条边，表示不同节点之间的关系。主要关系类型包括：发起人→活动、活动→参与人、场地→活动。`;
    }

    if (userMessage.includes('分析') || userMessage.includes('统计')) {
      const memberNodes = graphData?.nodes?.filter((n: any) => n.type === 'member')?.length || 0;
      const eventNodes = graphData?.nodes?.filter((n: any) => n.type === 'event')?.length || 0;
      const spaceNodes = graphData?.nodes?.filter((n: any) => n.type === 'space')?.length || 0;
      
      return `让我为你分析当前的社区网络：
- 总共 ${memberNodes} 个成员
- ${eventNodes} 个活动
- ${spaceNodes} 个场地
- ${edgeCount} 个关系连接

这个网络显示了一个活跃的社区，成员通过各种活动建立联系。`;
    }

    if (userMessage.includes('如何') || userMessage.includes('怎么')) {
      return `你可以这样使用图表：
1. 点击节点查看该节点的下游关系
2. 拖拽节点调整位置
3. 使用鼠标滚轮缩放
4. 在左侧上传CSV文件分析你的数据`;
    }

    // 默认回复
    const responses = [
      `基于你上传的数据，我看到这是一个有趣的社区网络！你想了解哪个方面的信息？`,
      `我可以帮你分析网络中的关键节点、关系密度或者活动模式。你有什么具体想了解的吗？`,
      `这个社区网络显示了丰富的互动关系。你可以点击图中的节点来探索具体的连接。`,
      `我注意到网络中有多种类型的节点和关系。你想深入了解某个特定的部分吗？`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(userMessage.content);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI回复失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，我现在无法回复。请稍后再试。',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 聊天浮窗 */}
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">AI助手</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* AI思考中指示器 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg rounded-bl-none px-3 py-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span>AI正在思考</span>
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入你的问题..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 圆形按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        )}
      </button>
    </div>
  );
}