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
  provider?: string;
  model?: string;
  isStreaming?: boolean; // 是否正在流式接收
}

interface AIChatProps {
  graphData?: any;
}

export default function AIChat({ graphData }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<string>('DeepSeek');
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

  // 流式调用AI API
  const generateAIResponseStream = async (userMessage: string): Promise<void> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          graphData: graphData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let aiMessageId = (Date.now() + 1).toString();
      let currentContent = '';
      
      // 创建一个空的AI消息作为占位符
      const aiMessage: Message = {
        id: aiMessageId,
        content: '',
        sender: 'ai',
        timestamp: new Date(),
        isStreaming: true,
      };

      // 先添加空消息
      setMessages(prev => [...prev, aiMessage]);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'init') {
                  // 更新提供商信息
                  setCurrentProvider(parsed.provider);
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, provider: parsed.provider, model: parsed.model }
                      : msg
                  ));
                } else if (parsed.type === 'content') {
                  // 累积内容
                  currentContent += parsed.content;
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: currentContent }
                      : msg
                  ));
                } else if (parsed.type === 'done') {
                  // 完成流式传输
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, isStreaming: false }
                      : msg
                  ));
                  break;
                } else if (parsed.type === 'error') {
                  // 处理错误
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { 
                          ...msg, 
                          content: parsed.message || '抱歉，AI服务出现错误。',
                          isStreaming: false 
                        }
                      : msg
                  ));
                  break;
                }
              } catch (parseError) {
                console.warn('解析流数据失败:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('AI流式调用失败:', error);
      
      // 添加错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，我现在无法回复。请检查网络连接或稍后再试。',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
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
      await generateAIResponseStream(userMessage.content);
    } catch (error) {
      console.error('发送消息失败:', error);
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

  // 生成数据摘要文本
  const getDataSummary = () => {
    if (!graphData) return '暂无数据';
    
    const nodeCount = graphData.nodes?.length || 0;
    const edgeCount = graphData.edges?.length || 0;
    const memberCount = graphData.nodes?.filter((n: any) => n.type === 'member')?.length || 0;
    const eventCount = graphData.nodes?.filter((n: any) => n.type === 'event')?.length || 0;
    const spaceCount = graphData.nodes?.filter((n: any) => n.type === 'space')?.length || 0;
    
    return `${nodeCount}节点 (${memberCount}成员, ${eventCount}活动, ${spaceCount}场地)`;
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
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 text-sm">AI助手</span>
                <span className="text-xs text-gray-500">
                  {currentProvider} | {getDataSummary()}
                </span>
              </div>
              <div className={`w-2 h-2 rounded-full ml-1 ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
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
                  <p className="whitespace-pre-wrap">
                    {message.content}
                    {/* 流式传输时显示光标 */}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-gray-500 ml-1 animate-pulse"></span>
                    )}
                  </p>
                  <div className={`text-xs mt-1 flex justify-between items-center ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {message.provider && message.sender === 'ai' && (
                      <span className="text-xs opacity-75">
                        {message.provider}
                        {message.isStreaming && " • 输入中..."}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* AI思考中指示器 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg rounded-bl-none px-3 py-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span>AI正在分析数据</span>
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
                placeholder={graphData ? "基于你的数据提问..." : "请先上传CSV数据"}
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
            {isLoading && (
              <div className="text-xs text-gray-500 mt-1">
                正在连接 {currentProvider} AI...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 圆形按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group relative"
        title={`AI助手 (${getDataSummary()})`}
      >
        {isLoading && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
        )}
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <ChatBubbleLeftRightIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        )}
      </button>
    </div>
  );
}