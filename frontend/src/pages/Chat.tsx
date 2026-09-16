import React, { useState, useEffect, useRef } from 'react';
import { BoltStyleChat } from '../components/ui/bolt-style-chat';
import { 
  SendHorizontal, 
  RotateCcw, 
  Sparkles, 
  Bot, 
  User, 
  Zap, 
  Lightbulb, 
  HelpCircle, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  generation_time?: number;
  tokens_per_sec?: number;
  output_tokens?: number;
}

interface ChatProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const Chat: React.FC<ChatProps> = ({ initialPrompt, onClearInitialPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('Vidhya 2.0 (Ours)');
  const [serverStatus, setServerStatus] = useState<'connected' | 'offline' | 'checking'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check health on mount
  useEffect(() => {
    fetch('/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') setServerStatus('connected');
        else setServerStatus('offline');
      })
      .catch(() => setServerStatus('offline'));
  }, []);

  // Handle initial prompt passed from Home quick search
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputVal('');
    setIsLoading(true);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || "No response received.",
        generation_time: data.generation_time,
        tokens_per_sec: data.tokens_per_sec,
        output_tokens: data.output_tokens
      };

      setMessages([...newHistory, assistantMessage]);
    } catch (err: any) {
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: `⚠️ Error communicating with Vidhya inference server: ${err.message || 'Check connection'}. Make sure backend is running on port 8000.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrategyClick = (strategy: string) => {
    const strategyPrompts: Record<string, string> = {
      hint: "Could you give me a subtle hint on the fundamental formula or concept without revealing the final answer?",
      example: "Could you provide a worked-out step-by-step example with simpler numbers to illustrate this principle?",
      explain: "Could you break down the intuition behind this derivation in simpler terms?",
      practice: "Give me a practice problem of similar difficulty to test my understanding."
    };
    if (strategyPrompts[strategy]) {
      handleSendMessage(strategyPrompts[strategy]);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col bg-slate-50">
      
      {/* If no conversation yet, show the BoltStyleChat Hero View */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col">
          <BoltStyleChat 
            title="What will you"
            subtitle="Deep STEM reasoning, Socratic pedagogy, and competitive exam accuracy."
            announcementText="Introducing Vidhya V2"
            placeholder="Ask a JEE, NEET, or Olympiad question (e.g. Derive the work-energy theorem)..."
            onSend={handleSendMessage}
          />
        </div>
      ) : (
        /* Conversation Stream View with Square Professional Cards */
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col">
          
          {/* Top Control Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <Sparkles className="size-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900">Vidhya 2.0 Active Session</span>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Socratic Reasoning Mode Enabled</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMessages([])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <RotateCcw className="size-3.5" />
              <span>New Problem</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-4 overflow-y-auto mb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-xl border shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-50/70 border-blue-200 ml-auto max-w-3xl text-slate-900'
                    : 'bg-white border-slate-200 mr-auto max-w-4xl text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-bold text-xs">
                  {msg.role === 'user' ? (
                    <>
                      <User className="size-3.5 text-brand-600" />
                      <span className="text-brand-700">You (Student)</span>
                    </>
                  ) : (
                    <>
                      <Bot className="size-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Vidhya STEM AI</span>
                      {msg.tokens_per_sec !== undefined && msg.tokens_per_sec > 0 && (
                        <span className="ml-auto px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px]">
                          ⚡ {msg.tokens_per_sec.toFixed(1)} t/s
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 mr-auto max-w-xl shadow-sm animate-pulse flex items-center gap-3">
                <Bot className="size-5 text-brand-600 animate-spin" />
                <span className="text-sm font-semibold text-slate-600">
                  Vidhya is synthesizing multi-step Socratic solution...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pedagogical Strategy Pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleStrategyClick('hint')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Lightbulb className="size-3.5 text-amber-500" />
              <span>Show Hint</span>
            </button>
            <button
              type="button"
              onClick={() => handleStrategyClick('example')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <FileText className="size-3.5 text-blue-500" />
              <span>Give Example</span>
            </button>
            <button
              type="button"
              onClick={() => handleStrategyClick('explain')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <HelpCircle className="size-3.5 text-purple-500" />
              <span>Explain Again</span>
            </button>
            <button
              type="button"
              onClick={() => handleStrategyClick('practice')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Sparkles className="size-3.5 text-emerald-500" />
              <span>Practice This</span>
            </button>
          </div>

          {/* Sticky Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-300 shadow-md focus-within:ring-2 focus-within:ring-brand-500"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask a follow-up question or enter step in derivation..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold text-xs transition-colors"
            >
              <span>Send</span>
              <SendHorizontal className="size-3.5" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

export default Chat;
