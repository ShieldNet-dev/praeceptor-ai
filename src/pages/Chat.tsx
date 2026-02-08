import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  ArrowLeft, 
  Paperclip,
  Loader2,
  User,
  X,
  FileText,
  Image as ImageIcon,
  Settings,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  PanelLeft,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GuidanceTrack, getTrackById } from '@/types/tracks';
import { toast } from 'sonner';
import VoiceInput from '@/components/VoiceInput';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';
import ChatSidebar from '@/components/ChatSidebar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  url?: string;
  storagePath?: string;
}

// Code block component with copy functionality
const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden bg-[#1e1e1e] border border-border/30">
      {/* Header with language label and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-border/20">
        <span className="text-xs font-mono text-muted-foreground">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
        showLineNumbers={children.split('\n').length > 3}
        lineNumberStyle={{ opacity: 0.4, paddingRight: '1rem', minWidth: '2.5rem' }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

// Inline code component
const InlineCode = ({ children }: { children: React.ReactNode }) => (
  <code className="px-1.5 py-0.5 mx-0.5 rounded bg-secondary/80 text-primary font-mono text-[0.9em]">
    {children}
  </code>
);

// Message actions component
const MessageActions = ({ 
  message, 
  onCopy, 
  onRegenerate 
}: { 
  message: Message; 
  onCopy: () => void; 
  onRegenerate: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  };

  return (
    <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
        title="Copy"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
      </button>
      <button
        onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
        className={`p-1.5 rounded-md hover:bg-secondary/80 transition-colors ${
          feedback === 'up' ? 'text-success' : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Good response"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
        className={`p-1.5 rounded-md hover:bg-secondary/80 transition-colors ${
          feedback === 'down' ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Bad response"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
      <button
        onClick={onRegenerate}
        className="p-1.5 rounded-md hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
        title="Regenerate"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};

// ChatGPT-style message component
const ChatMessage = ({ 
  message, 
  onRegenerate,
  isLastAssistant 
}: { 
  message: Message; 
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`w-full py-6 ${isUser ? 'bg-transparent' : 'bg-secondary/10'}`}>
      <div className="w-full max-w-4xl mx-auto px-4 md:px-8">
        <div className="flex gap-4 group">
          {/* Avatar */}
          <div className="flex-shrink-0 mt-1">
            {isUser ? (
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="w-4 h-4 text-accent" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <div className="font-semibold text-foreground mb-1 text-sm">
              {isUser ? 'You' : 'Praeceptor AI'}
            </div>

            {/* Message content */}
            {isUser ? (
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
            ) : message.content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed
                prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                prose-p:my-3 prose-p:leading-relaxed
                prose-ul:my-3 prose-ul:pl-6 prose-ol:my-3 prose-ol:pl-6
                prose-li:my-1 prose-li:leading-relaxed
                prose-strong:text-foreground prose-strong:font-semibold
                prose-blockquote:border-l-primary prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-4
                prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80
                prose-hr:my-6 prose-hr:border-border
              ">
                <ReactMarkdown
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !className && typeof children === 'string' && !children.includes('\n');
                      
                      if (isInline) {
                        return <InlineCode>{children}</InlineCode>;
                      }
                      
                      return (
                        <CodeBlock language={match?.[1] || ''}>
                          {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                      );
                    },
                    pre({ children }) {
                      return <>{children}</>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            )}

            {/* Message actions for assistant messages */}
            {!isUser && message.content && isLastAssistant && onRegenerate && (
              <MessageActions 
                message={message} 
                onCopy={() => {}} 
                onRegenerate={onRegenerate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Chat = () => {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<GuidanceTrack>('learning');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start with sidebar closed for immediate chat experience
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, loading: authLoading } = useAuth();

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to scrollHeight, capped at max-height
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const initChat = async () => {
      if (!user) return;

      const convIdParam = searchParams.get('conversation');
      const trackParam = searchParams.get('track') as GuidanceTrack | null;
      const topicParam = searchParams.get('topic');

      if (convIdParam) {
        // Load existing conversation
        setLoading(true);
        try {
          const { data: conv, error: convError } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', convIdParam)
            .eq('user_id', user.id)
            .single();

          if (convError || !conv) {
            toast.error('Conversation not found');
            navigate('/dashboard');
            return;
          }

          setConversationId(conv.id);
          setCurrentTrack(conv.track as GuidanceTrack);

          // Load messages
          const { data: msgs, error: msgsError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convIdParam)
            .order('created_at', { ascending: true });

          if (!msgsError && msgs) {
            setMessages(msgs as Message[]);
          }
        } catch (error) {
          toast.error('Failed to load conversation');
        } finally {
          setLoading(false);
        }
      } else if (trackParam) {
        // New conversation with specified track
        setCurrentTrack(trackParam);
        
        // If a topic is specified, set it as the initial input
        if (topicParam) {
          setInput(`I want to learn about ${topicParam}. Please teach me this topic from the basics.`);
        }
      } else {
        navigate('/dashboard');
      }
    };

    if (user) {
      initChat();
    }
  }, [user, searchParams, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 10MB.`);
        continue;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      try {
        const { error } = await supabase.storage
          .from('user-uploads')
          .upload(filePath, file);

        if (error) throw error;

        // Use signed URLs instead of public URLs for private bucket security
        const { data: urlData, error: urlError } = await supabase.storage
          .from('user-uploads')
          .createSignedUrl(filePath, 3600); // 1 hour expiration

        if (urlError) {
          console.error('Failed to create signed URL:', urlError);
          throw urlError;
        }

        newFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          url: urlData.signedUrl,
          storagePath: filePath
        });

        // Save to database
        await supabase.from('user_uploads').insert({
          user_id: user.id,
          conversation_id: conversationId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath
        });
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || !user) return;

    const userMessage = input.trim();
    const filesToSend = [...uploadedFiles];
    setInput('');
    setUploadedFiles([]);
    setSending(true);

    try {
      let convId = conversationId;

      // Create conversation if it doesn't exist
      if (!convId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            track: currentTrack,
            title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
          })
          .select()
          .single();

        if (convError || !newConv) {
          throw new Error('Failed to create conversation');
        }

        convId = newConv.id;
        setConversationId(convId);
      }

      // Build message content with file references
      let messageContent = userMessage;
      if (filesToSend.length > 0) {
        const fileRefs = filesToSend.map(f => `[Attached: ${f.name}]`).join('\n');
        messageContent = fileRefs + (userMessage ? '\n\n' + userMessage : '');
      }

      // Add user message to UI
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: messageContent,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      // Save user message to database
      const { data: savedUserMsg, error: userMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          role: 'user',
          content: messageContent
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // Update with real message
      setMessages((prev) => 
        prev.map((m) => (m.id === tempUserMsg.id ? (savedUserMsg as Message) : m))
      );

      // Add placeholder assistant message for streaming
      const tempAssistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: tempAssistantId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }]);

      // Stream AI response with conversation history
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/praeceptor-chat`;
      
      // Prepare conversation history for context (exclude the just-added user message)
      const historyForAI = messages
        .filter(m => m.id !== tempUserMsg.id)
        .map(m => ({ role: m.role, content: m.content }));
      
      // Get user's session token for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to continue');
      }
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          message: messageContent, 
          track: currentTrack, 
          conversationId: convId,
          history: historyForAI,
          stream: true 
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line as data arrives
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
              // Update the assistant message with streaming content
              setMessages((prev) => 
                prev.map((m) => 
                  m.id === tempAssistantId 
                    ? { ...m, content: fullResponse }
                    : m
                )
              );
            }
          } catch {
            // Incomplete JSON, put it back and wait for more data
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush for any remaining buffered lines
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
            }
          } catch { /* ignore partial leftovers */ }
        }
      }

      // Save AI message to database
      const { data: savedAiMsg, error: aiMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          role: 'assistant',
          content: fullResponse
        })
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;

      // Update temp message with saved message
      setMessages((prev) => 
        prev.map((m) => (m.id === tempAssistantId ? (savedAiMsg as Message) : m))
      );

      // Update progress
      await supabase
        .from('user_progress')
        .update({
          total_messages: messages.length + 2,
          last_activity_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('track', currentTrack);

    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRegenerate = async () => {
    if (messages.length < 2 || sending) return;
    
    // Find the last user message
    const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMsgIndex === -1) return;
    
    const lastUserMsg = messages[messages.length - 1 - lastUserMsgIndex];
    
    // Remove the last assistant message
    setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
    
    // Re-send with the last user message
    setInput(lastUserMsg.content);
    setTimeout(() => {
      setInput('');
      handleSendMessage(lastUserMsg.content);
    }, 100);
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !user) return;
    setSending(true);

    try {
      let convId = conversationId;

      if (!convId) {
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            track: currentTrack,
            title: messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : '')
          })
          .select()
          .single();

        if (convError || !newConv) throw new Error('Failed to create conversation');
        convId = newConv.id;
        setConversationId(convId);
      }

      // Add placeholder assistant message for streaming
      const tempAssistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [...prev, {
        id: tempAssistantId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }]);

      // Stream AI response
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/praeceptor-chat`;
      
      // Get user's session token for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Please sign in to continue');
      }
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          message: messageContent, 
          track: currentTrack, 
          conversationId: convId,
          stream: true 
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullResponse += content;
              setMessages((prev) => 
                prev.map((m) => 
                  m.id === tempAssistantId 
                    ? { ...m, content: fullResponse }
                    : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save AI message to database
      const { data: savedAiMsg, error: aiMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          role: 'assistant',
          content: fullResponse
        })
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;

      setMessages((prev) => 
        prev.map((m) => (m.id === tempAssistantId ? (savedAiMsg as Message) : m))
      );

    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate');
    } finally {
      setSending(false);
    }
  };

  const track = getTrackById(currentTrack);
  const TrackIcon = track?.icon;

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
    navigate(`/chat?track=${currentTrack}`);
  };

  const handleSelectConversation = (convId: string) => {
    navigate(`/chat?conversation=${convId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* ChatGPT-style Sidebar */}
      {user && (
        <ChatSidebar
          userId={user.id}
          currentConversationId={conversationId}
          currentTrack={currentTrack}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
        />
      )}

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col h-screen transition-all duration-300",
        sidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b border-border/50 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="hidden md:flex"
              >
                <PanelLeft className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              title="New chat"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="font-semibold text-foreground truncate">{track?.name || 'Chat'}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Praeceptor AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Messages - scrollable area */}
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
              <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Welcome to {track?.name}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {track?.description}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Start by asking a question or describing what you'd like to learn.
              </p>
            </div>
          ) : (
            <div className="pb-4">
              {messages.map((message, index) => {
                const isLastAssistant = message.role === 'assistant' && 
                  index === messages.length - 1 || 
                  (index === messages.length - 2 && messages[messages.length - 1]?.role === 'user');
                return (
                  <ChatMessage 
                    key={message.id} 
                    message={message} 
                    isLastAssistant={isLastAssistant && message.role === 'assistant'}
                    onRegenerate={isLastAssistant && message.role === 'assistant' ? handleRegenerate : undefined}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input area - ChatGPT style fixed at bottom */}
        <footer className="flex-shrink-0 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="max-w-4xl mx-auto px-4 py-4">
            {/* Uploaded files preview */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm"
                  >
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-primary" />
                    ) : (
                      <FileText className="w-4 h-4 text-primary" />
                    )}
                    <span className="max-w-[120px] sm:max-w-[150px] truncate">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input container - ChatGPT style rounded box */}
            <div className="relative flex items-end gap-2 p-2 rounded-2xl border border-border/50 bg-secondary/30 shadow-sm">
              {/* Attachment button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="h-9 w-9 flex-shrink-0 rounded-xl hover:bg-secondary"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </Button>

              {/* Voice input */}
              <div className="flex-shrink-0">
                <VoiceInput 
                  onTranscript={(text) => setInput((prev) => prev + (prev ? ' ' : '') + text)}
                  disabled={sending}
                />
              </div>

              {/* Textarea */}
              <Textarea
                ref={textareaRef}
                placeholder="Message Praeceptor AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="flex-1 resize-none min-h-[36px] max-h-[200px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2 px-1 text-base overflow-y-auto"
              />

              {/* Send button */}
              <Button
                variant="hero"
                size="icon"
                onClick={handleSend}
                disabled={sending || (!input.trim() && uploadedFiles.length === 0)}
                className="h-9 w-9 flex-shrink-0 rounded-xl"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Disclaimer text like ChatGPT */}
            <p className="text-xs text-muted-foreground text-center mt-2 hidden sm:block">
              Praeceptor AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chat;
