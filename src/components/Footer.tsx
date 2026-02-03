import { Github, Twitter, Linkedin } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import praeceptorLogoFull from '@/assets/praeceptor-logo-full.png';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const links = {
    product: [
      { label: "Features", action: () => scrollToSection('features') },
      { label: "Pricing", action: () => {} },
      { label: "Curriculum", action: () => scrollToSection('curriculum') },
      { label: "Enterprise", action: () => {} },
    ],
    resources: [
      { label: "Documentation", action: () => navigate('/docs') },
      { label: "Blog", action: () => navigate('/blog') },
      { label: "Career Hub", action: () => navigate('/career') },
      { label: "Support", action: () => navigate('/support') },
    ],
    company: [
      { label: "About", action: () => navigate('/about') },
      { label: "Careers", action: () => {} },
      { label: "Privacy", action: () => {} },
      { label: "Terms", action: () => navigate('/terms') },
    ],
  };

  return (
    <footer className="relative border-t border-border/50 bg-card/30">
      <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => navigate('/')}>
              <img src={praeceptorLogoFull} alt="Praeceptor AI" className="h-12 sm:h-16 w-auto" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm">
              Your intelligent cybersecurity tutor. Learn security concepts, practice skills, 
              and advance your career with AI-powered education.
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-colors"
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-3 sm:mb-4 capitalize text-sm sm:text-base">{category}</h4>
              <ul className="space-y-2 sm:space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {currentYear} Praeceptor AI. All rights reserved.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground font-mono">
            <span className="text-primary">{'>'}</span> Securing the future, one lesson at a time
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
