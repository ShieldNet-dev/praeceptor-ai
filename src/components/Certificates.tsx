import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Download, 
  Share2, 
  Linkedin, 
  ExternalLink,
  Loader2,
  ArrowLeft,
  CheckCircle,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import praeceptorLogoIcon from '@/assets/praeceptor-logo-icon.png';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Certificate {
  id: string;
  certificate_type: 'module' | 'course' | 'assessment';
  title: string;
  recipient_name: string;
  course_name: string | null;
  module_name: string | null;
  completion_date: string;
  verification_code: string;
}

export const Certificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  const fetchCertificates = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .order('completion_date', { ascending: false });

      if (error) throw error;
      setCertificates((data || []) as Certificate[]);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (cert: Certificate) => {
    // Generate a simple PDF-like download (in a real app, you'd use a PDF library)
    const content = `
PRAECEPTOR AI - COMPLETION CERTIFICATE

This certifies that

${cert.recipient_name}

has successfully completed

${cert.course_name || cert.module_name || cert.title}

Date: ${new Date(cert.completion_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}

Verification Code: ${cert.verification_code}

Verify at: ${window.location.origin}/verify/${cert.verification_code}

---
Praeceptor AI - Ethical Hacker Mindset Training
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${cert.verification_code}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareLinkedIn = (cert: Certificate) => {
    const title = `Praeceptor AI - ${cert.course_name || cert.module_name || cert.title}`;
    const summary = `I just completed ${cert.course_name || cert.module_name} on Praeceptor AI! Training with an ethical hacker mindset. 🔐`;
    const url = `${window.location.origin}/verify/${cert.verification_code}`;
    
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  const getTypeColor = (type: Certificate['certificate_type']) => {
    const colors = {
      module: 'from-blue-500 to-cyan-400',
      course: 'from-purple-500 to-pink-400',
      assessment: 'from-green-500 to-emerald-400',
    };
    return colors[type] || 'from-primary to-accent';
  };

  if (loading) {
    return (
      <Card className="glass cyber-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (certificates.length === 0) {
    return (
      <Card className="glass cyber-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            My Certificates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No certificates yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Complete courses and modules to earn verifiable certificates!
            </p>
            <Button onClick={() => navigate('/courses')}>
              Browse Courses
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass cyber-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          My Certificates ({certificates.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${getTypeColor(cert.certificate_type)} text-white flex-shrink-0`}>
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-foreground">
                        {cert.course_name || cert.module_name || cert.title}
                      </h4>
                      <Badge variant="secondary" className="flex-shrink-0 capitalize">
                        {cert.certificate_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Issued to {cert.recipient_name} on {new Date(cert.completion_date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                      <span>Verification: {cert.verification_code}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(cert)}
                        className="gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareLinkedIn(cert)}
                        className="gap-1.5"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        Share
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/verify/${cert.verification_code}`, '_blank')}
                        className="gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Verify
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Certificates;
