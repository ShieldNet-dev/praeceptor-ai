import { 
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
  Lock, 
  Bug, 
  Siren,
  Wifi,
  Search
} from "lucide-react";

const topics = [
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

const Topics = () => {
  // Display only first 6 topics in landing page
  const displayTopics = topics.slice(0, 6);

  return (
    <section id="curriculum" className="relative py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-mono text-primary bg-primary/10 rounded-full border border-primary/20">
            &lt;courses /&gt;
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explore <span className="text-gradient">Security Courses</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From fundamentals to advanced techniques, our comprehensive courses cover every aspect of modern cybersecurity with structured modules and AI-powered assessments.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTopics.map((topic, index) => (
            <div
              key={topic.title}
              className="group relative p-6 rounded-xl glass cyber-border cursor-pointer hover:scale-[1.02] transition-all duration-300 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'forwards' }}
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
                    Structured Modules
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

        {/* Note about more courses */}
        <div className="mt-12 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
          <p className="text-muted-foreground mb-2">
            <span className="text-primary font-semibold">10+ comprehensive courses</span> with structured modules, AI assessments, and XP rewards!
          </p>
          <p className="text-sm text-muted-foreground">
            Each course includes multiple modules with hands-on content and Praeceptor AI assessments.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Topics;
