'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Trash2,
  Sparkles,
  Mic,
  MicOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/lib/context/AuthContext';

// Extend Window for SpeechRecognition (webkit + standard)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}

interface Message {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const SUGGESTED_PROMPTS_TEMPLATE = (symbol: string) => [
  `Spent ${symbol}150 on lunch today`,
  'Show my spending this month',
  `Add ${symbol}500 groceries expense`,
  'What is my top spending category?',
];

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const symbol = useCurrency();
  const SUGGESTED_PROMPTS = SUGGESTED_PROMPTS_TEMPLATE(symbol);

  // Check for browser speech recognition support
  useEffect(() => {
    setVoiceSupported(
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }, []);

  useEffect(() => {
    if (isOpen && initialLoading) {
      fetchMessages();
    }
  }, [isOpen, initialLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      _id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev.slice(0, -1),
          data.userMessage,
          data.assistantMessage,
        ]);
        // Fire a global event so TransactionsPage (and others) auto-refresh
        const mutatingIntents = ['add_expense', 'update', 'delete'];
        if (data.intent && mutatingIntents.includes(data.intent)) {
          window.dispatchEvent(new CustomEvent('expense-changed', { detail: { intent: data.intent } }));
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clearChat = async () => {
    try {
      await fetch('/api/chat', { method: 'DELETE' });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const startVoice = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);

      // Auto-send when the user finishes speaking (final result)
      if (event.results[event.results.length - 1].isFinal) {
        recognition.stop();
        setTimeout(() => sendMessage(transcript), 100);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [sendMessage]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700',
          isOpen && 'hidden'
        )}
      >
        <MessageSquare className="w-6 h-6" />
      </Button>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border z-50 flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Nebula AI</h3>
              <p className="text-xs text-muted-foreground">Your expense assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !initialLoading ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-indigo-500/50 mb-4" />
              <h4 className="text-foreground font-medium mb-2">
                Hi! I&apos;m Nebula
              </h4>
              <p className="text-muted-foreground text-sm mb-6">
                I can help you track expenses, analyze spending, and manage budgets.
              </p>
              <div className="space-y-2">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={cn(
                  'flex flex-col',
                  msg.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2',
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-xs text-neutral-600 mt-1">
                  {format(new Date(msg.createdAt), 'h:mm a')}
                </span>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-border"
        >
          {/* Listening indicator */}
          {isListening && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs text-red-400 font-medium">Listening... speak now</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Type a message...'}
              className={cn(
                'flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground transition-colors',
                isListening && 'border-red-500/50 bg-muted'
              )}
              disabled={loading}
            />
            {/* Voice button — only shown if browser supports it */}
            {voiceSupported && (
              <Button
                type="button"
                size="icon"
                onClick={isListening ? stopVoice : startVoice}
                disabled={loading}
                className={cn(
                  'transition-all duration-200',
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : 'bg-neutral-700 hover:bg-neutral-600 text-muted-foreground'
                )}
                title={isListening ? 'Stop listening' : 'Speak to add expense'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
