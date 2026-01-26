import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Inbox,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_response: string | null;
  admin_responded_at: string | null;
  created_at: string;
  updated_at: string;
}

const AdminSupport = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!user) return;

      try {
        const { data: isAdminData } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

        if (!isAdminData) {
          navigate('/dashboard');
          return;
        }

        setIsAdmin(true);

        // Fetch all tickets
        const { data: ticketData, error } = await supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(ticketData || []);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else {
        checkAdminAndFetch();
      }
    }
  }, [user, authLoading, navigate]);

  const handleRespond = async () => {
    if (!selectedTicket || !response.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          admin_response: response.trim(),
          admin_responded_at: new Date().toISOString(),
          status: 'resolved'
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, admin_response: response.trim(), status: 'resolved', admin_responded_at: new Date().toISOString() }
          : t
      ));
      setSelectedTicket(null);
      setResponse('');
      toast.success('Response sent successfully');
    } catch (error) {
      console.error('Error responding:', error);
      toast.error('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status: newStatus } : t
      ));
      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      open: { variant: 'secondary', icon: <Inbox className="w-3 h-3" /> },
      in_progress: { variant: 'default', icon: <Clock className="w-3 h-3" /> },
      resolved: { variant: 'outline', icon: <CheckCircle className="w-3 h-3" /> },
      closed: { variant: 'outline', icon: <CheckCircle className="w-3 h-3" /> },
    };
    const config = variants[status] || variants.open;
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-slate-500/20 text-slate-400',
      normal: 'bg-blue-500/20 text-blue-400',
      high: 'bg-orange-500/20 text-orange-400',
      urgent: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority] || colors.normal}`}>
        {priority}
      </span>
    );
  };

  const filteredTickets = statusFilter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === statusFilter);

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    total: tickets.length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-8 h-8" />
          <span className="text-lg font-bold text-foreground">Support Dashboard</span>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass cyber-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Inbox className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-2xl font-bold">{stats.open}</p>
                  <p className="text-xs text-muted-foreground">Open</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass cyber-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass cyber-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass cyber-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <Card className="glass cyber-border">
              <CardContent className="p-8 text-center">
                <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'all' ? 'No support tickets yet' : `No ${statusFilter.replace('_', ' ')} tickets`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTickets.map(ticket => (
              <Card key={ticket.id} className="glass cyber-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-1">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{ticket.message}</p>
                      
                      {ticket.admin_response && (
                        <div className="p-3 rounded bg-primary/10 border-l-2 border-primary mb-3">
                          <p className="text-xs font-medium mb-1">Your Response:</p>
                          <p className="text-sm text-muted-foreground">{ticket.admin_response}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Select 
                          value={ticket.status} 
                          onValueChange={(value) => handleStatusChange(ticket.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {!ticket.admin_response && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setResponse('');
                            }}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Respond
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Response Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg glass">
              <CardHeader>
                <CardTitle>Respond to: {selectedTicket.subject}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded bg-secondary/30">
                  <p className="text-sm text-muted-foreground">{selectedTicket.message}</p>
                </div>
                <Textarea
                  placeholder="Type your response..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRespond} disabled={submitting || !response.trim()}>
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Response
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSupport;
