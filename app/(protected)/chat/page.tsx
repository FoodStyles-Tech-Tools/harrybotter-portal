"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import ChatSidebar from "@/components/ChatSidebar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  buttons?: any;
};

function parseButtons(text: string) {
  const buttons: string[] = [];
  const cleaned = text.replace(/{{\s*button:\s*([^}]+)\s*}}/gi, (_, label: string) => {
    const value = label.trim();
    if (value) {
      buttons.push(value);
    }
    return "";
  });

  return { buttons, cleanedText: cleaned.replace(/\n{3,}/g, "\n\n").trim() };
}

function extractResponseText(response: unknown) {
  if (!response) return "";

  let data = response;

  // If it's a string, try to parse it as JSON in case the bot returned a JSON string
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          data = parsed;
        }
      } catch {
        // Not valid JSON, continue
      }
    }
  }

  let record: any = data;
  if (Array.isArray(data) && data.length > 0) {
    record = data[0];
  }

  if (typeof record !== "object" || record === null) {
    return String(record ?? "");
  }

  const candidate = record.output ?? record.text ?? record.message ?? record.Reply ?? record.reply ?? record.response;
  if (typeof candidate === "string") {
    return candidate;
  }

  // Fallback to stringified object if no common fields found
  try {
    return JSON.stringify(record, null, 2);
  } catch {
    return "";
  }
}

// Inline SVGs for icons
const Icons = {
  Send: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
  ),
  Sparkles: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
  Ticket: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.69.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4" />
      <path d="M2 9h20" />
      <path d="M14 15h3" />
    </svg>
  ),
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};

function MarkdownMessage({ text, onAction, disabled, isLatest }: { text: string; onAction: (text: string) => void; disabled?: boolean; isLatest?: boolean }) {
  // Try to parse text as JSON in case it's a raw JSON string from history
  let content = text;
  if (typeof text === "string" && text.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        content = parsed.output ?? parsed.text ?? parsed.message ?? parsed.Reply ?? parsed.reply ?? parsed.response ?? text;
      }
    } catch {
      // Not valid JSON, keep original
    }
  }

  // Detect raw ticket IDs and convert them to markdown links for ReactMarkdown to handle
  // We do this by replacing HRB-\d+ that are NOT already part of a markdown link
  const processedContent = content.replace(/(?<!\[)HRB-\d+(?!(\]|\]\(.*?\)))/gi, (match) => {
    return `[${match}](/check-ticket?ticket=${match.toUpperCase()})`;
  });

  return (
    <div className="space-y-4">
      <div className="text-gray-800 leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ ...props }) => {
              const url = props.href || "";
              const label = String(props.children || "");
              const isTicketLink = url.includes("check-ticket") || label.match(/HRB-\d+/i);
              
              return (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline decoration-2 underline-offset-4 decoration-blue-200"
                >
                  {isTicketLink && <Icons.Ticket className="w-3.5 h-3.5" />}
                  {props.children}
                </a>
              );
            },
            // Handle standard markdown elements with custom styling
            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => <ul className="list-disc pl-5 my-1.5 space-y-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 my-1.5 space-y-0.5">{children}</ol>,
            li: ({ children }) => <li className="pl-1 leading-normal">{children}</li>,
            p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
            h1: ({ children }) => <h1 className="text-2xl font-bold mt-3 mb-2 text-gray-900">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold mt-2.5 mb-1.5 text-gray-900">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-bold mt-2 mb-1 text-gray-900">{children}</h3>,
            code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm text-red-600">{children}</code>,
            pre: ({ children }) => <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl my-2 overflow-x-auto font-mono text-sm">{children}</pre>,
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
      
      {/* Contextual Action Buttons - Only show on latest message */}
      {isLatest && content.includes("Do you want me to go ahead and forward this to TechTool as a ticket?") && (
        <div className="pt-2">
           <button
             onClick={() => onAction("Yes")}
             disabled={disabled}
             className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95 group disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none disabled:pointer-events-none"
           >
             <Icons.Plus className="w-4 h-4" />
             Create Ticket
           </button>
        </div>
      )}
    </div>
  );
}

export default function TechToolAssistantPage() {
  const chatUrl = process.env.NEXT_PUBLIC_N8N_CHAT_URL;
  const sessionState = authClient.useSession();
  const user = sessionState?.data?.user;
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load messages when session changes
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`/api/chat/messages?sessionId=${currentSessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
        
        // Also fetch session info to check for ticket_id
        const sessionRes = await fetch('/api/chat/sessions');
        if (sessionRes.ok) {
          const sessions = await sessionRes.json();
          const session = sessions.find((s: any) => s.id === currentSessionId);
          setCurrentTicketId(session?.ticket_id ?? null);
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    void fetchMessages();
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const canSend = Boolean(chatUrl && user && inputValue.trim().length > 0);
  
  const userMetadata = useMemo(
    () => ({
      userId: user?.id,
      name: user?.name,
      email: user?.email,
    }),
    [user]
  );

  const saveMessageToDb = async (sessionId: string, sender: "user" | "bot", text: string, buttons?: string[]) => {
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, sender, text, buttons }),
      });
    } catch (error) {
      console.error("Failed to persist message", error);
    }
  };

  const createNewSession = async (firstMessage: string) => {
    try {
      const title = firstMessage.length > 30 ? firstMessage.substring(0, 30) + "..." : firstMessage;
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const session = await res.json();
        return session.id as string;
      }
    } catch (error) {
      console.error("Failed to create session", error);
    }
    return null;
  };

  const sendMessage = async (text: string) => {
    if (!chatUrl || !user) {
      return;
    }

    let sessionId = currentSessionId;
    
    // Auto-create session if none selected
    if (!sessionId) {
      sessionId = await createNewSession(text);
      if (!sessionId) return;
      setCurrentSessionId(sessionId);
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsSending(true);

    // Persist user message
    void saveMessageToDb(sessionId, "user", text);

    try {
      const response = await fetch(chatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sendMessage",
          sessionId,
          chatInput: text,
          metadata: userMetadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = await response.text();
      }

      const responseText = extractResponseText(data);
      const { buttons, cleanedText } = parseButtons(responseText);
      const displayText =
        cleanedText || (buttons.length > 0 ? "Choose an option:" : "No response received.");

      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: displayText,
        buttons: buttons.length > 0 ? buttons : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
      
      // Persist bot message
      void saveMessageToDb(sessionId, "bot", displayText, buttons.length > 0 ? buttons : undefined);

      // Ticket Detection Logic
      const ticketMatch = displayText.match(/HRB-\d+/i);
      if (ticketMatch) {
        const ticketId = ticketMatch[0].toUpperCase();
        setCurrentTicketId(ticketId);
        
        // Update session in DB
        void fetch('/api/chat/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, ticketId }),
        });
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: "Error: Failed to reach the assistant.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      void saveMessageToDb(sessionId, "bot", errorMessage.text);
      console.error("Chat request failed", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => {
    if (!canSend) {
      return;
    }
    void sendMessage(inputValue.trim());
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setCurrentTicketId(null);
    setMessages([]);
  };

  // Extract first name for greeting
  const firstName = user?.name ? user.name.split(" ")[0] : "User";

  return (
    <div className="flex h-[calc(100vh-4.5rem)] bg-white/60 backdrop-blur-sm overflow-hidden font-outfit">
      {/* Sidebar */}
      <ChatSidebar 
        currentSessionId={currentSessionId} 
        onSelectSession={setCurrentSessionId} 
        onNewChat={handleNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto w-full flex flex-col scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-10 flex flex-col">
          {!chatUrl ? (
            <div className="mt-20 flex flex-col items-center text-center p-8 border border-dashed border-gray-300 rounded-xl bg-gray-50/50">
              <p className="text-gray-500">
                Missing <code>NEXT_PUBLIC_N8N_CHAT_URL</code> configuration.
              </p>
            </div>
          ) : messages.length === 0 && !isLoadingMessages ? (
            // Empty State / Greeting
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-medium tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                    Hello, {firstName}
                  </span>
                </h1>
                <h2 className="text-4xl md:text-5xl text-[#c4c7c5] font-medium tracking-tight">
                  How can I help you today?
                </h2>
              </div>
            </div>
          ) : isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Icons.Sparkles className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-sm text-gray-400">Loading conversation history...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 w-full py-2">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Bot Avatar */}
                  {message.sender === "bot" && (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-1 shadow-md border-2 border-white">
                       <img src="/wizard-bot.jpg" alt="Wizard Assistant" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                    <div
                      className={`px-5 py-3 text-[0.95rem] leading-relaxed whitespace-pre-wrap shadow-sm ${
                        message.sender === "user"
                          ? "bg-[#f0f4f9] text-[#1f1f1f] rounded-2xl rounded-tr-sm"
                          : "bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100"
                      }`}
                    >
                      {message.sender === "bot" ? (
                        <MarkdownMessage 
                          text={message.text} 
                          onAction={sendMessage} 
                          disabled={isSending || !!currentTicketId} 
                          isLatest={index === messages.length - 1}
                        />
                      ) : (
                        message.text
                      )}
                    </div>

                    {/* Buttons (if any) */}
                    {message.buttons && message.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.buttons.map((label: string) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => void sendMessage(label)}
                            disabled={isSending}
                            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-100 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isSending && (
                <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 animate-pulse shadow-sm border border-gray-100">
                       <img src="/wizard-bot.jpg" alt="Wizard Assistant" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-white px-5 py-3.5 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
          </div>
        </div>

        {/* Input Area */}
        <div className="pb-8 w-full flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 md:px-8 w-full">
            {currentTicketId ? (
              <div className="flex items-center justify-center gap-3 bg-blue-50/50 rounded-full px-6 py-4 border border-blue-100 mb-2 animate-in fade-in duration-500">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 animate-bounce">
                  <Icons.Sparkles className="w-4 h-4" />
                </div>
                <p className="text-sm font-semibold text-blue-800">
                  Ticket <span className="underline">{currentTicketId}</span> has been created. This chat is now locked.
                </p>
                <button 
                  onClick={handleNewChat}
                  className="ml-4 px-4 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all duration-200"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              <div 
                className={`flex items-center gap-3 bg-white rounded-full px-4 py-3 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 focus-within:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] focus-within:border-blue-100 transition-all duration-300 ${
                  !chatUrl ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Tell us what you need"
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 text-base placeholder-gray-500 h-full py-1 ml-2"
                  disabled={isSending || !chatUrl || !user}
                />
                
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend || isSending}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    inputValue.trim().length > 0 
                     ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" 
                     : "bg-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Icons.Send className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="text-center mt-3">
              <p className="text-xs text-gray-400">
                TechTool Assistant can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
