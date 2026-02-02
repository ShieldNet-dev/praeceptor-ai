import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  MessageSquare,
  Send,
  Loader2,
  ChevronRight,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCourseDetails, useCourses } from "@/hooks/useCourses";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import praeceptorLogoIcon from "@/assets/praeceptor-logo-icon.png";

interface AssessmentMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ModuleView = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { course, modules, refetch } = useCourseDetails(courseId || '');
  const { markModuleContentRead, completeModuleAssessment } = useCourses();
  
  const [stage, setStage] = useState<'content' | 'assessment' | 'complete'>('content');
  const [messages, setMessages] = useState<AssessmentMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<{passed: boolean; score: number} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentModule = modules.find(m => m.id === moduleId);
  const currentIndex = modules.findIndex(m => m.id === moduleId);
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;

  useEffect(() => {
    if (currentModule?.progress?.content_read && !currentModule?.isCompleted) {
      setStage('assessment');
    } else if (currentModule?.isCompleted) {
      setStage('complete');
      setAssessmentResult({
        passed: true,
        score: currentModule.progress?.assessment_score || 100
      });
    }
  }, [currentModule]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMarkContentRead = async () => {
    if (!currentModule || !courseId) return;
    await markModuleContentRead(currentModule.id, courseId);
    setStage('assessment');
    
    // Initialize assessment with Praeceptor
    const systemMessage = `I've finished reading the module "${currentModule.title}". I'm ready for my assessment.`;
    await sendAssessmentMessage(systemMessage, true);
  };

  const sendAssessmentMessage = async (message: string, isInitial = false) => {
    if (!user || !currentModule) return;

    setSending(true);
    
    const userMessage: AssessmentMessage = { role: 'user', content: message };
    if (!isInitial) {
      setMessages(prev => [...prev, userMessage]);
    }
    setInput('');

    try {
      // Build assessment prompt
      const assessmentPrompt = `You are Praeceptor AI conducting a module assessment.

## MODULE BEING ASSESSED
Title: ${currentModule.title}
Learning Objectives: ${JSON.stringify(currentModule.learning_objectives)}

## YOUR ROLE
You are assessing whether the student has understood the key concepts from this module. 

## ASSESSMENT RULES
1. Ask 3-5 questions that test understanding of the learning objectives
2. Questions should be practical and scenario-based when possible
3. After each answer, provide brief feedback
4. Keep track of correct/incorrect answers internally
5. After all questions, provide a final assessment with:
   - A score out of 100
   - Whether they PASSED (score >= 70) or NEED TO REVIEW
   - Key areas to improve if any

## IMPORTANT
- Be encouraging but honest
- If they pass, congratulate them
- If they don't pass, encourage them to review and try again
- Format your final assessment clearly with "ASSESSMENT RESULT:" followed by "PASSED" or "NEEDS REVIEW" and "SCORE: X/100"

Start by welcoming them to the assessment and asking your first question.`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/praeceptor-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          message: isInitial ? "I'm ready for my module assessment." : message,
          track: 'learning',
          history: isInitial ? [] : [
            { role: 'system', content: assessmentPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content }))
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantContent = data.response || data.choices?.[0]?.message?.content;
      
      if (assistantContent) {
        const assistantMessage: AssessmentMessage = { role: 'assistant', content: assistantContent };
        setMessages(prev => isInitial ? [assistantMessage] : [...prev, assistantMessage]);

        // Check if assessment is complete
        if (assistantContent.includes('ASSESSMENT RESULT:') || 
            assistantContent.includes('SCORE:') ||
            assistantContent.toLowerCase().includes('passed') && assistantContent.toLowerCase().includes('congratulations')) {
          // Parse the result
          const passedMatch = assistantContent.match(/PASSED|passed|Passed/);
          const scoreMatch = assistantContent.match(/SCORE:\s*(\d+)/i) || assistantContent.match(/(\d+)\s*(?:out of|\/)\s*100/i);
          
          const passed = !!passedMatch;
          const score = scoreMatch ? parseInt(scoreMatch[1]) : (passed ? 85 : 50);

          setAssessmentComplete(true);
          setAssessmentResult({ passed, score });

          // Save the result
          if (currentModule && courseId) {
            await completeModuleAssessment(
              currentModule.id,
              courseId,
              passed,
              score,
              currentModule.xp_reward
            );
            if (passed) {
              setStage('complete');
            }
          }
        }
      }
    } catch (error) {
      console.error('Assessment error:', error);
      toast.error('Failed to communicate with Praeceptor');
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || sending) return;
    sendAssessmentMessage(input.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentModule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Module not found</h2>
          <Button onClick={() => navigate(`/courses/${courseId}`)}>Back to Course</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass shadow-lg">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/courses/${courseId}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Module {currentIndex + 1} of {modules.length}
              </span>
              <Progress value={((currentIndex + 1) / modules.length) * 100} className="w-24 h-2" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-primary" />
              <span>{currentModule.xp_reward} XP</span>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-4xl px-4 pt-24 pb-32">
        {/* Module Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{currentModule.title}</h1>
          <p className="text-muted-foreground">{currentModule.description}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {currentModule.estimated_minutes} min read
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {currentModule.learning_objectives.length} objectives
            </span>
          </div>
        </div>

        {/* Learning Objectives */}
        {stage === 'content' && (
          <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Learning Objectives
            </h3>
            <ul className="space-y-2">
              {currentModule.learning_objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content Stage */}
        {stage === 'content' && (
          <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
            <ReactMarkdown>{currentModule.content}</ReactMarkdown>
          </div>
        )}

        {/* Assessment Stage */}
        {stage === 'assessment' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="font-medium">Assessment with Praeceptor AI</span>
            </div>

            {/* Messages */}
            <div className="space-y-4 mb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <img src={praeceptorLogoIcon} alt="AI" className="w-5 h-5" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-4 rounded-xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary/50'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <img src={praeceptorLogoIcon} alt="AI" className="w-5 h-5" />
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Complete Stage */}
        {stage === 'complete' && assessmentResult && (
          <div className="text-center p-8 rounded-xl glass cyber-border">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Module Completed! 🎉</h2>
            <p className="text-muted-foreground mb-4">
              You scored {assessmentResult.score}% and earned {currentModule.xp_reward} XP
            </p>
            
            {nextModule && !nextModule.isLocked ? (
              <Button onClick={() => navigate(`/courses/${courseId}/modules/${nextModule.id}`)}>
                Next Module: {nextModule.title}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => navigate(`/courses/${courseId}`)}>
                Back to Course
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Bottom Actions */}
      {stage === 'content' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-border">
          <div className="container mx-auto max-w-4xl">
            <Button className="w-full" size="lg" onClick={handleMarkContentRead}>
              I've Read This - Start Assessment
              <MessageSquare className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {stage === 'assessment' && !assessmentComplete && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-border">
          <div className="container mx-auto max-w-4xl">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your answer..."
                className="min-h-[50px] max-h-[150px] resize-none"
                disabled={sending}
              />
              <Button 
                size="icon" 
                onClick={handleSend} 
                disabled={!input.trim() || sending}
                className="h-auto"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {stage === 'assessment' && assessmentComplete && !assessmentResult?.passed && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-border">
          <div className="container mx-auto max-w-4xl flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => {
              setStage('content');
              setMessages([]);
              setAssessmentComplete(false);
              setAssessmentResult(null);
            }}>
              Review Content
            </Button>
            <Button className="flex-1" onClick={() => {
              setMessages([]);
              setAssessmentComplete(false);
              setAssessmentResult(null);
              sendAssessmentMessage("I'm ready for my module assessment.", true);
            }}>
              Retry Assessment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleView;
