import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Send, 
  ArrowLeft, 
  Paperclip,
  Loader2,
  Bot,
  User,
  X,
  FileText,
  Image as ImageIcon,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { GuidanceTrack, getTrackById } from '@/types/tracks';
import { toast } from 'sonner';
import VoiceInput from '@/components/VoiceInput';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
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

        const { data: urlData } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(filePath);

        newFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          url: urlData.publicUrl,
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

      // Get AI response
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('praeceptor-chat', {
        body: {
          message: messageContent,
          track: currentTrack,
          conversationId: convId
        }
      });

      if (aiError) throw aiError;

      // Save AI message
      const { data: savedAiMsg, error: aiMsgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          role: 'assistant',
          content: aiResponse.response
        })
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;

      setMessages((prev) => [...prev, savedAiMsg as Message]);

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

  const track = getTrackById(currentTrack);
  const TrackIcon = track?.icon || Shield;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${track?.color || 'from-primary to-cyan-400'} text-white`}>
              <TrackIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{track?.name || 'Chat'}</h1>
              <p className="text-xs text-muted-foreground">Praeceptor AI</p>
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

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
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
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-accent/20 text-accent'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}
                  >
                    <div
                      className={`inline-block p-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'glass'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-left">{message.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-accent/20 text-accent">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="glass rounded-2xl p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input area */}
      <footer className="sticky bottom-0 glass border-t border-border/50">
        <div className="container mx-auto max-w-4xl px-4 py-4">
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
                  <span className="max-w-[150px] truncate">{file.name}</span>
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

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </Button>
            <VoiceInput 
              onTranscript={(text) => setInput((prev) => prev + (prev ? ' ' : '') + text)}
              disabled={sending}
            />
            <Textarea
              placeholder="Ask Praeceptor AI anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="resize-none min-h-[44px] max-h-32 flex-1"
            />
            <Button
              variant="hero"
              size="icon"
              onClick={handleSend}
              disabled={sending || (!input.trim() && uploadedFiles.length === 0)}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
