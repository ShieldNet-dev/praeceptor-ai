import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  ArrowLeft, 
  HelpCircle, 
  MessageSquare, 
  Send,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_response: string | null;
  created_at: string;
}

const Support = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch FAQs
        const { data: faqData } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_published', true)
          .order('display_order');
        
        setFaqs(faqData || []);

        // Fetch user's tickets
        if (user) {
          const { data: ticketData } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          setTickets(ticketData || []);
        }
      } catch (error) {
        console.error('Error fetching support data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          message: message.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setTickets(prev => [data, ...prev]);
      setSubject('');
      setMessage('');
      toast.success('Support ticket submitted successfully');
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      open: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      in_progress: { variant: 'default', icon: <AlertCircle className="w-3 h-3" /> },
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

  // Default FAQs if none in database
  const defaultFaqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I start learning cybersecurity?',
      answer: 'Start by selecting the "Learning Track" from your dashboard. Praeceptor AI will guide you through foundational concepts including networking, security principles, and hands-on exercises.',
      category: 'Getting Started'
    },
    {
      id: '2',
      question: 'What certifications does Praeceptor AI help with?',
      answer: 'Praeceptor AI supports preparation for CompTIA Security+, CEH (Certified Ethical Hacker), OSCP, CISSP, and many more industry certifications through our Exam Prep track.',
      category: 'Certifications'
    },
    {
      id: '3',
      question: 'Can I use Praeceptor AI for my final year project?',
      answer: 'Yes! Our Academic Track is specifically designed to help with final year projects, research methodology, and defense preparation.',
      category: 'Academic'
    },
    {
      id: '4',
      question: 'How do I change my learning track?',
      answer: 'Go to Settings > Manage Tracks to add or remove guidance tracks based on your current learning goals.',
      category: 'Account'
    },
    {
      id: '5',
      question: 'Is the AI content suitable for beginners?',
      answer: 'Absolutely! Praeceptor AI adapts to your skill level. Beginners will receive foundational explanations, while advanced users get more technical deep-dives.',
      category: 'Learning'
    },
  ];

  const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs;
  const categories = [...new Set(displayFaqs.map(f => f.category))];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={praeceptorLogoIcon} alt="Praeceptor AI" className="w-8 h-8" />
          <span className="text-lg font-bold text-foreground">Support Center</span>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            Help Center
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            How can we <span className="text-gradient">help you?</span>
          </h1>
          <p className="text-muted-foreground">
            Find answers to common questions or submit a support request
          </p>
        </div>

        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Contact
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            {categories.map(category => (
              <Card key={category} className="glass cyber-border">
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {displayFaqs
                      .filter(f => f.category === category)
                      .map((faq, index) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            {/* Submit Ticket Form */}
            <Card className="glass cyber-border">
              <CardHeader>
                <CardTitle>Submit a Request</CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Send us a message and we'll get back to you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Describe your issue or question..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full gap-2">
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* My Tickets */}
            {tickets.length > 0 && (
              <Card className="glass cyber-border">
                <CardHeader>
                  <CardTitle>My Requests</CardTitle>
                  <CardDescription>Track the status of your support requests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="p-4 rounded-lg bg-secondary/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{ticket.subject}</span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{ticket.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                      {ticket.admin_response && (
                        <div className="mt-3 p-3 rounded bg-primary/10 border-l-2 border-primary">
                          <p className="text-sm font-medium mb-1">Admin Response:</p>
                          <p className="text-sm text-muted-foreground">{ticket.admin_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Support;
