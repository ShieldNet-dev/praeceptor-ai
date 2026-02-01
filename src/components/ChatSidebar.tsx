import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PanelLeftClose, 
  PanelLeft, 
  Plus, 
  MessageSquare, 
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { GuidanceTrack } from '@/types/tracks';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface Conversation {
  id: string;
  title: string;
  track: GuidanceTrack;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  userId: string;
  currentConversationId: string | null;
  currentTrack: GuidanceTrack;
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
}

const ChatSidebar = ({
  userId,
  currentConversationId,
  currentTrack,
  isOpen,
  onToggle,
  onNewChat,
  onSelectConversation
}: ChatSidebarProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setConversations(data || []);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userId, currentConversationId]);

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: editTitle.trim() })
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => 
        prev.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c)
      );
      toast.success('Conversation renamed');
    } catch (error) {
      toast.error('Failed to rename conversation');
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this conversation?')) return;

    try {
      // Delete messages first
      await supabase.from('messages').delete().eq('conversation_id', id);
      
      // Then delete conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== id));
      
      // If deleting current conversation, start new chat
      if (id === currentConversationId) {
        onNewChat();
      }
      
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by date
  const groupedConversations = filteredConversations.reduce((groups, conv) => {
    const date = new Date(conv.updated_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let group: string;
    if (date.toDateString() === today.toDateString()) {
      group = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday';
    } else if (date > weekAgo) {
      group = 'Previous 7 Days';
    } else {
      group = 'Older';
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(conv);
    return groups;
  }, {} as Record<string, Conversation[]>);

  const groupOrder = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

  const handleConversationClick = (convId: string) => {
    if (editingId !== convId) {
      onSelectConversation(convId);
      if (isMobile) {
        onToggle(); // Close drawer on mobile after selection
      }
    }
  };

  const handleNewChatClick = () => {
    onNewChat();
    if (isMobile) {
      onToggle(); // Close drawer on mobile
    }
  };

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-9 w-9"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewChatClick}
          className="h-9 w-9"
          title="New chat"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background/50"
          />
        </div>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              {searchQuery ? 'No conversations found' : 'No conversations yet. Start chatting!'}
            </p>
          ) : (
            groupOrder.map(group => {
              const convs = groupedConversations[group];
              if (!convs || convs.length === 0) return null;

              return (
                <div key={group} className="mb-4">
                  <h3 className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                    {group}
                  </h3>
                  <div className="space-y-0.5">
                    {convs.map(conv => (
                      <div
                        key={conv.id}
                        className={cn(
                          "group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors",
                          conv.id === currentConversationId
                            ? "bg-primary/10 text-foreground"
                            : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => handleConversationClick(conv.id)}
                      >
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        
                        {editingId === conv.id ? (
                          <div className="flex-1 flex items-center gap-1">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-6 text-sm px-1 bg-background"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(conv.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRename(conv.id);
                              }}
                              className="p-0.5 hover:text-success"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(null);
                              }}
                              className="p-0.5 hover:text-destructive"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 text-sm truncate">
                              {conv.title}
                            </span>
                            <div className={cn(
                              "items-center gap-0.5",
                              isMobile ? "flex" : "hidden group-hover:flex"
                            )}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(conv);
                                }}
                                className="p-1 rounded hover:bg-background/50"
                                title="Rename"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(conv.id);
                                }}
                                className="p-1 rounded hover:bg-background/50 hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border/50">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            navigate('/dashboard');
            if (isMobile) onToggle();
          }}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">Back to Dashboard</span>
        </Button>
      </div>
    </>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <>
        {/* Toggle button when drawer is closed */}
        {!isOpen && (
          <button
            onClick={onToggle}
            className="fixed left-4 top-20 z-50 p-2 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground transition-colors"
            title="Open menu"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        <Drawer open={isOpen} onOpenChange={onToggle}>
          <DrawerContent className="h-[85vh] flex flex-col">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Conversations</DrawerTitle>
            </DrawerHeader>
            <SidebarContent />
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <>
      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-20 z-50 p-2 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground transition-colors"
          title="Open sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-40 bg-secondary/50 backdrop-blur-xl border-r border-border/50 flex flex-col transition-all duration-300",
          isOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default ChatSidebar;
