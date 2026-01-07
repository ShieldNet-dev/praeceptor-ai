import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Search,
  Cpu,
  Network,
  Shield,
  Code,
  Terminal,
  Brain,
  Cloud,
  Smartphone,
  Link,
  FileSearch,
  Globe,
  Wifi,
  Lock,
  Bug,
  Siren,
  MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const securityTopics = [
  { icon: Cpu, title: "Computer Architecture", level: "Beginner", color: "from-blue-400 to-indigo-500" },
  { icon: Network, title: "Networking", level: "Beginner", color: "from-cyan-400 to-blue-500" },
  { icon: Shield, title: "Network Security", level: "Intermediate", color: "from-primary to-cyan-400" },
  { icon: Code, title: "Computer Programming", level: "Beginner", color: "from-green-400 to-emerald-500" },
  { icon: Terminal, title: "Python Fundamentals", level: "Beginner", color: "from-yellow-400 to-orange-500" },
  { icon: Terminal, title: "Python for Ethical Hacking", level: "Intermediate", color: "from-yellow-500 to-red-500" },
  { icon: Code, title: "JavaScript", level: "Beginner", color: "from-amber-400 to-yellow-500" },
  { icon: Code, title: "TypeScript", level: "Intermediate", color: "from-blue-500 to-indigo-600" },
  { icon: Bug, title: "Ethical Hacking", level: "Intermediate", color: "from-red-400 to-pink-500" },
  { icon: Bug, title: "Penetration Testing", level: "Advanced", color: "from-orange-400 to-red-500" },
  { icon: Brain, title: "AI/ML Architecture", level: "Intermediate", color: "from-purple-400 to-pink-500" },
  { icon: Brain, title: "AI/ML Security", level: "Advanced", color: "from-purple-500 to-red-500" },
  { icon: Cloud, title: "Cloud Computing Architecture", level: "Intermediate", color: "from-sky-400 to-blue-500" },
  { icon: Cloud, title: "Cloud Computing Security", level: "Advanced", color: "from-sky-500 to-indigo-500" },
  { icon: Smartphone, title: "Application Security (Mobile/Web)", level: "Intermediate", color: "from-teal-400 to-cyan-500" },
  { icon: Link, title: "Blockchain Development", level: "Intermediate", color: "from-violet-400 to-purple-500" },
  { icon: Link, title: "Blockchain Security", level: "Advanced", color: "from-violet-500 to-pink-500" },
  { icon: FileSearch, title: "Auditing", level: "Advanced", color: "from-slate-400 to-gray-500" },
  { icon: FileSearch, title: "Forensics", level: "Advanced", color: "from-emerald-400 to-teal-500" },
  { icon: Globe, title: "Introduction to Darkweb", level: "Intermediate", color: "from-gray-600 to-slate-700" },
  { icon: Search, title: "OSINT", level: "Intermediate", color: "from-blue-400 to-cyan-500" },
  { icon: Wifi, title: "IoT Architecture", level: "Intermediate", color: "from-lime-400 to-green-500" },
  { icon: Shield, title: "IoT Security", level: "Advanced", color: "from-lime-500 to-emerald-500" },
  { icon: Lock, title: "Cryptography", level: "Intermediate", color: "from-indigo-400 to-purple-500" },
  { icon: Lock, title: "Advanced Cryptography Techniques", level: "Advanced", color: "from-indigo-500 to-violet-500" },
  { icon: Wifi, title: "VoIP", level: "Intermediate", color: "from-teal-400 to-blue-500" },
  { icon: Shield, title: "VoIP Security", level: "Advanced", color: "from-teal-500 to-cyan-500" },
  { icon: Bug, title: "Malware Analysis", level: "Advanced", color: "from-red-500 to-orange-500" },
  { icon: Terminal, title: "Exploit Development for Ethical Hackers", level: "Expert", color: "from-red-600 to-pink-600" },
  { icon: Siren, title: "Incident Response", level: "Advanced", color: "from-orange-500 to-red-500" },
];

const SecurityTopics = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = securityTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTopicClick = (topicTitle: string) => {
    // Navigate to chat with the selected topic
    navigate('/dashboard', { state: { selectedTopic: topicTitle } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass shadow-lg">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">Security Topics</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-4 pt-24 pb-16">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50"
            />
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic, index) => (
            <div
              key={topic.title}
              onClick={() => handleTopicClick(topic.title)}
              className="group relative p-6 rounded-xl glass cyber-border cursor-pointer hover:scale-[1.02] transition-all duration-300 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.05 * index}s`, animationFillMode: 'forwards' }}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${topic.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br ${topic.color} text-primary-foreground`}>
                  <topic.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {topic.title}
                </h3>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Click to learn with AI
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    topic.level === "Beginner" 
                      ? "bg-success/20 text-success" 
                      : topic.level === "Intermediate" 
                        ? "bg-yellow-500/20 text-yellow-400" 
                        : topic.level === "Advanced" 
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-destructive/20 text-destructive"
                  }`}>
                    {topic.level}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note about more topics */}
        <div className="mt-12 p-6 glass rounded-xl cyber-border text-center">
          <MessageSquare className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">More Topics Coming Soon!</h3>
          <p className="text-muted-foreground mb-4">
            During subsequent updates, more security topics will be available. If you would like to see 
            a new topic or course added, feel free to submit that in the review section.
          </p>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            Submit Topic Request
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SecurityTopics;
