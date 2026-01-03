"use client";

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Loader2, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * LifeOS AI Chat Interface
 *
 * A slide-over chat panel that acts as the intelligent assistant for LifeOS.
 * Uses Vercel AI SDK's useChat hook for streaming responses.
 *
 * Features:
 * - Real-time streaming responses
 * - Auto-scroll to latest message
 * - Clean Shadcn UI design
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 */
export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, error } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('❌ Chat Error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    },
    onFinish: (message) => {
      console.log('✅ Chat finished:', message);
    },
  });

  const isLoading = status === 'in_progress';

  // Log status changes for debugging
  useEffect(() => {
    console.log('🔄 Chat status changed:', status);
  }, [status]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus textarea when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle form submission
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      await sendMessage({
        role: 'user',
        content: input,
      });
      setInput('');
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        sendMessage({
          role: 'user',
          content: input,
        });
        setInput('');
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[500px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">LifeOS AI</SheetTitle>
                <SheetDescription className="text-xs">
                  Your intelligent productivity assistant
                </SheetDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="font-semibold text-lg">Welcome to LifeOS AI</h3>
                <p className="text-sm text-muted-foreground">
                  I'm here to help you organize your life, manage tasks, and achieve your goals.
                  Ask me anything!
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                <button
                  onClick={() => {
                    setInput("What can you help me with?");
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  What can you help me with?
                </button>
                <button
                  onClick={() => {
                    setInput("Help me plan my day");
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  Help me plan my day
                </button>
                <button
                  onClick={() => {
                    setInput("Give me productivity tips");
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  Productivity tips
                </button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex w-full",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm border border-destructive/20">
                <div className="font-semibold mb-1">❌ Error</div>
                <div className="text-xs opacity-90">
                  {error.message || 'Something went wrong. Please try again.'}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  Check browser console (F12) and terminal for details
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <form onSubmit={onSubmit} className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="min-h-[60px] max-h-[120px] resize-none rounded-xl"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-[60px] w-[60px] rounded-xl shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
