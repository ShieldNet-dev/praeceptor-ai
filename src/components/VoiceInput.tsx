import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const VoiceInput = ({ onTranscript, disabled }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const transcriptRef = useRef('');

  const initRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast.error('Speech recognition not supported in this browser');
      return null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        // Auto-restart if user hasn't stopped
        try {
          recognition.start();
        } catch (e) {
          // Already started or other error
        }
      } else {
        // User stopped - send the transcript
        setIsRecording(false);
        setIsProcessing(false);
        
        if (transcriptRef.current.trim()) {
          onTranscript(transcriptRef.current.trim());
          toast.success('Voice transcribed successfully');
        } else {
          toast.info('No speech detected');
        }
        transcriptRef.current = '';
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied. Please allow microphone access.');
        isListeningRef.current = false;
        setIsRecording(false);
        setIsProcessing(false);
      } else if (event.error === 'no-speech') {
        // This is normal - silence detected, will auto-restart via onend
      } else if (event.error === 'aborted') {
        // User aborted, ignore
      } else {
        toast.error(`Speech recognition error: ${event.error}`);
        isListeningRef.current = false;
        setIsRecording(false);
        setIsProcessing(false);
      }
    };

    return recognition;
  }, [onTranscript]);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }

      if (recognitionRef.current) {
        transcriptRef.current = '';
        isListeningRef.current = true;
        setIsRecording(true);
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  }, [initRecognition]);

  const stopRecording = useCallback(() => {
    isListeningRef.current = false;
    setIsProcessing(true);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        isListeningRef.current = false;
        recognitionRef.current.abort();
      }
    };
  }, []);

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={isRecording ? 'bg-destructive/20 border-destructive text-destructive animate-pulse' : ''}
      title={isRecording ? 'Stop recording' : 'Start voice input'}
    >
      {isProcessing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isRecording ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </Button>
  );
};

export default VoiceInput;
