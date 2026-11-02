import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';

const VoiceSearchButton = ({ onResult, className = '' }) => {
  const { language = 'en' } = useAppContext();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSupported(true);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(
        language === 'hi'
          ? 'आपके ब्राउज़र में वॉइस सर्च समर्थित नहीं है। कृपया लिखकर खोजें।'
          : 'Voice search is not supported by your browser. Please type to search.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        toast(
          language === 'hi'
            ? '🎙️ बोलिए... (उदा. महिंद्रा, रोटावेटर, सोनभद्र)'
            : '🎙️ Listening... (e.g. Mahindra, Rotavator, 50 HP)',
          { id: 'voice-search-listening', duration: 4000 }
        );
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onResult(transcript);
          toast.success(
            language === 'hi'
              ? `खोजा जा रहा है: "${transcript}"`
              : `Searching for: "${transcript}"`,
            { id: 'voice-search-listening' }
          );
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.error(
            language === 'hi'
              ? 'आवाज़ पहचानी नहीं जा सकी। कृपया पुनः प्रयास करें।'
              : 'Could not recognize speech. Please try again.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={startListening}
      className={`relative inline-flex items-center justify-center rounded-xl p-2 transition-all ${
        isListening
          ? 'bg-rose-500 text-white ring-4 ring-rose-200 animate-pulse'
          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
      } ${className}`}
      title={language === 'hi' ? 'आवाज़ से खोजें (हिंदी / English)' : 'Voice search in Hindi or English'}
      aria-label="Voice Search"
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
};

export default VoiceSearchButton;
