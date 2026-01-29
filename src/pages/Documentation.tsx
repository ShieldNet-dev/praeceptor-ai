import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  BookOpen, 
  Search,
  Rocket,
  MessageSquare,
  Settings,
  Shield,
  Award,
  Users,
  Zap,
  ChevronRight
} from 'lucide-react';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: {
    heading: string;
    body: string;
  }[];
}

const Documentation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const docs: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Rocket,
      content: [
        {
          heading: 'Welcome to Praeceptor AI',
          body: 'Praeceptor AI is your intelligent cybersecurity tutor. Whether you\'re a complete beginner or an experienced professional, our AI adapts to your level and learning goals.'
        },
        {
          heading: 'Creating Your Account',
          body: 'Sign up with your email or Google account. After registration, you\'ll be guided through our onboarding process to select your learning tracks and customize your experience.'
        },
        {
          heading: 'Choosing Your Tracks',
          body: 'Praeceptor AI offers multiple learning tracks: Learning (foundational skills), Mentorship (career guidance), Exam Prep (certification preparation), SIWES (industrial training), Academic (research & projects), and Career (job preparation).'
        }
      ]
    },
    {
      id: 'chat-interface',
      title: 'Chat Interface',
      icon: MessageSquare,
      content: [
        {
          heading: 'Starting a Conversation',
          body: 'From your dashboard, click "Start New Session" and select your desired track. You can also continue previous conversations or start a topic-specific session from the Security Topics section.'
        },
        {
          heading: 'Asking Questions',
          body: 'Type your question or topic in the chat input. Praeceptor AI understands natural language, so feel free to ask questions as you would ask a human mentor.'
        },
        {
          heading: 'File Uploads',
          body: 'You can upload files (PDFs, images, documents) to get help with specific content. This is especially useful for SIWES logbooks, academic papers, or code review.'
        },
        {
          heading: 'Voice Input',
          body: 'Click the microphone icon to use voice input. Your speech will be transcribed and sent to Praeceptor AI.'
        }
      ]
    },
    {
      id: 'tracks',
      title: 'Learning Tracks',
      icon: Award,
      content: [
        {
          heading: 'Learning Track',
          body: 'Ideal for beginners and those wanting to build solid foundations. Covers networking, security concepts, operating systems, and hands-on skills.'
        },
        {
          heading: 'Exam Prep Track',
          body: 'Focused preparation for certifications like CompTIA Security+, CEH, OSCP, CISSP, and more. Includes practice questions, exam tips, and targeted study plans.'
        },
        {
          heading: 'SIWES Track',
          body: 'Designed for Nigerian students on industrial training. Helps with logbook entries, weekly reports, and supervisor presentations.'
        },
        {
          heading: 'Academic Track',
          body: 'Support for final year projects, research proposals, and thesis writing in cybersecurity-related topics.'
        },
        {
          heading: 'Career Track',
          body: 'CV review, interview preparation, job search strategies, and career path guidance for cybersecurity roles.'
        },
        {
          heading: 'Mentorship Track',
          body: 'Personalized guidance based on your goals, strengths, and areas for improvement. Your AI mentor helps you navigate your security journey.'
        }
      ]
    },
    {
      id: 'dashboard',
      title: 'Dashboard & Progress',
      icon: Zap,
      content: [
        {
          heading: 'Understanding Your Stats',
          body: 'Your dashboard shows XP points (earned through learning), streak days (consecutive days of activity), total sessions, and active tracks.'
        },
        {
          heading: 'Security Topics',
          body: 'Quick access to curated cybersecurity topics. Clicking a topic starts a focused learning session on that subject.'
        },
        {
          heading: 'Conversation History',
          body: 'All your conversations are saved and searchable. You can rename, continue, or delete conversations as needed.'
        }
      ]
    },
    {
      id: 'settings',
      title: 'Account Settings',
      icon: Settings,
      content: [
        {
          heading: 'Profile Settings',
          body: 'Update your display name, email, and profile picture in the Profile tab of Settings.'
        },
        {
          heading: 'Managing Tracks',
          body: 'Add or remove learning tracks anytime from Settings > Manage Tracks. Your progress in each track is preserved.'
        },
        {
          heading: 'Security Settings',
          body: 'Enable two-factor authentication (coming soon) and manage your password from the Security tab.'
        },
        {
          heading: 'Providing Feedback',
          body: 'Help us improve! Submit ratings and feedback from the Feedback tab in Settings.'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      content: [
        {
          heading: 'Data Protection',
          body: 'Your conversations and data are encrypted and stored securely. We never share your personal information with third parties.'
        },
        {
          heading: 'Ethical Guidelines',
          body: 'Praeceptor AI follows strict ethical guidelines. All simulations are sandboxed, and we emphasize legal, defensive security practices.'
        },
        {
          heading: 'Content Moderation',
          body: 'Our AI is designed to refuse requests for malicious purposes and will redirect users toward ethical alternatives.'
        }
      ]
    }
  ];

  const filteredDocs = docs.map(section => ({
    ...section,
    content: section.content.filter(
      item =>
        item.heading.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.body.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.content.length > 0);

  const displayDocs = searchQuery ? filteredDocs : docs;

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
          <span className="text-lg font-bold text-foreground">Documentation</span>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 relative z-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4" />
            Documentation
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Learn how to use <span className="text-gradient">Praeceptor AI</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know to make the most of your cybersecurity learning journey.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Links */}
        {!searchQuery && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {docs.map(section => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="glass rounded-xl p-4 text-left hover:border-primary/50 transition-all cyber-border group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <IconComponent className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">
                      {section.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Documentation Sections */}
        <div className="space-y-8">
          {displayDocs.map(section => {
            const IconComponent = section.icon;
            return (
              <Card key={section.id} id={section.id} className="glass cyber-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.content.map((item, index) => (
                    <div key={index}>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-primary" />
                        {item.heading}
                      </h3>
                      <p className="text-muted-foreground text-sm pl-6">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Still have questions?
          </p>
          <Button variant="outline" onClick={() => navigate('/support')}>
            Contact Support
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Documentation;
