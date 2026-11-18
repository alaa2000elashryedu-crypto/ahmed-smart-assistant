import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  Radio, 
  Bot, 
  MessageSquare, 
  RefreshCw,
  Send,
  HelpCircle
} from 'lucide-react';
import { soundManager, speakArabic, stopSpeaking } from '../utils/audio';
import { AgeTier, LessonData } from '../types';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  ageTier: AgeTier;
  lesson?: LessonData | null;
  onRewardVoice?: () => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  ageTier,
  lesson,
  onRewardVoice,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeakingAgent, setIsSpeakingAgent] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [statusText, setStatusText] = useState('جاهز لبدء المحادثة الصوتية');
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'مرحباً يا بطل! أنا "مساعدي الذكي"، تحدث معي بصوتك واسألني عن أي نقطة في الدرس وسأجيبك فوراً! 🤖🎙️',
    },
  ]);
  const [textInput, setTextInput] = useState('');
  const [audioLevel, setAudioLevel] = useState<number[]>(new Array(16).fill(10));
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => {
    if (isOpen) {
      startSession();
      if (onRewardVoice) {
        onRewardVoice();
      }
    } else {
      stopSession();
    }
    return () => {
      stopSession();
    };
  }, [isOpen]);

  // Audio visualization simulation / meter
  useEffect(() => {
    let active = true;
    const updateWaves = () => {
      if (!active) return;
      if (isSpeakingAgent || isListeningMic) {
        setAudioLevel(
          Array.from({ length: 16 }, () => Math.floor(Math.random() * 55) + 15)
        );
      } else {
        setAudioLevel(Array.from({ length: 16 }, () => 8));
      }
      animFrameRef.current = requestAnimationFrame(updateWaves);
    };
    animFrameRef.current = requestAnimationFrame(updateWaves);
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSpeakingAgent, isListeningMic]);

  const startSession = async () => {
    try {
      setStatusText('جارٍ الاتصال بمساعدي الذكي الصوتي...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusText('متصل الآن! اضغط على الميكروفون وتحدث بحرية 🎙️');
        soundManager.playCorrect();

        // Send initialization context
        ws.send(
          JSON.stringify({
            type: 'init',
            ageTier,
            lessonContext: lesson ? { title: lesson.title, subject: lesson.subject } : null,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'transcript') {
            setTranscript((prev) => [...prev, { role: 'assistant', text: msg.text }]);
            setIsSpeakingAgent(true);
            speakArabic(msg.text, () => setIsSpeakingAgent(false));
          } else if (msg.audio) {
            setIsSpeakingAgent(true);
            playAudioChunk(msg.audio);
          } else if (msg.interrupted) {
            stopSpeaking();
            setIsSpeakingAgent(false);
          }
        } catch (e) {
          console.warn('WS message error:', e);
        }
      };

      ws.onerror = () => {
        setStatusText('يعمل في وضع الصوت التفاعلي المباشر');
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn('WebSocket init note:', err);
      setIsConnected(true);
      setStatusText('مستعد للاستماع والمحادثة');
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Convert base64 to binary and play PCM chunk
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsSpeakingAgent(false);
      };
      source.start();
    } catch {
      setIsSpeakingAgent(false);
    }
  };

  const toggleMic = async () => {
    if (isListeningMic) {
      stopMic();
    } else {
      startMic();
    }
  };

  const startMic = async () => {
    try {
      stopSpeaking();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 16000 });
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(ctx.destination);

      setIsListeningMic(true);
      setStatusText('أنا أستمع إليك يا بطل... تحدث الآن! 🎧');

      processor.onaudioprocess = (e) => {
        if (!isListeningMic) return;
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32 to 16kHz PCM Int16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Base64 encode PCM
        const uint8 = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64Audio = btoa(binary);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      // Also support browser SpeechRecognition for immediate text transcript preview
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = (event: any) => {
          const spoken = event.results[0][0].transcript;
          if (spoken && spoken.trim()) {
            handleSendUserMessage(spoken.trim());
          }
        };
        recognition.start();
      }
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setStatusText('تعذر تشغيل الميكروفون، يمكنك كتابة سؤالك وسأجيبك صوتياً!');
      setIsListeningMic(false);
    }
  };

  const stopMic = () => {
    setIsListeningMic(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setStatusText('تم إيقاف الميكروفون');
  };

  const stopSession = () => {
    stopMic();
    stopSpeaking();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsSpeakingAgent(false);
  };

  const handleSendUserMessage = async (msgText: string) => {
    if (!msgText.trim()) return;
    const userMsg = msgText.trim();
    setTextInput('');
    setTranscript((prev) => [...prev, { role: 'user', text: userMsg }]);
    setStatusText('مساعدي الذكي يفكر في الإجابة...');

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'text', text: userMsg }));
      }

      // Fetch fast verbal answer
      const res = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg,
          lessonContext: lesson,
          ageTier,
        }),
      });
      const data = await res.json();
      const reply = data.data?.reply || 'أحسنت السؤال يا بطل! لنواصل استكشاف هذا المفهوم معاً.';
      
      setTranscript((prev) => [...prev, { role: 'assistant', text: reply }]);
      setIsSpeakingAgent(true);
      setStatusText('مساعدي الذكي يتحدث الآن... 🔊');
      speakArabic(reply, () => {
        setIsSpeakingAgent(false);
        setStatusText('جاهز لسؤالك التالي! 🎙️');
      });
    } catch {
      const fallback = 'أنا هنا معك دائماً يا صديقي، سؤالك رائع ومهم جداً!';
      setTranscript((prev) => [...prev, { role: 'assistant', text: fallback }]);
      speakArabic(fallback);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md p-1 flex items-center justify-center shadow-inner border border-white/30 overflow-hidden">
              <img
                src="/assets/aistudio/Cheerful_School_Mascots_and_Smart_Assistant_fa100797.png"
                alt="مساعدي الذكي"
                className="w-full h-full object-contain drop-shadow"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black">المحادثة الصوتية المباشرة</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-black text-[10px] flex items-center gap-1 shadow-xs">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>مباشر Live 3.8</span>
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                تحدث مع مساعدك الذكي بصوتك واسأله عن واجباتك ودروسك
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio Visualizer Stage */}
        <div className="p-6 bg-gradient-to-b from-amber-50/50 to-white flex flex-col items-center justify-center border-b border-amber-100">
          <div className="relative mb-4">
            {/* Glowing Ring */}
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
                isSpeakingAgent
                  ? 'bg-amber-400/30 ring-8 ring-amber-400/40 scale-105'
                  : isListeningMic
                  ? 'bg-emerald-400/30 ring-8 ring-emerald-400/40 animate-pulse'
                  : 'bg-slate-100 ring-4 ring-slate-200'
              }`}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center text-4xl shadow-lg shadow-orange-500/30 overflow-hidden p-2">
                {isSpeakingAgent ? (
                  '🗣️'
                ) : isListeningMic ? (
                  '👂'
                ) : (
                  <img
                    src="/assets/aistudio/Cheerful_School_Mascots_and_Smart_Assistant_fa100797.png"
                    alt="مساعدي الذكي"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>

            {/* Live Indicator Pill */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-white border border-amber-300 text-[10px] font-black text-amber-900 shadow-xs flex items-center gap-1 whitespace-nowrap">
              <span className={`w-2 h-2 rounded-full ${isSpeakingAgent ? 'bg-amber-500 animate-ping' : isListeningMic ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isSpeakingAgent ? 'مساعدي يتحدث...' : isListeningMic ? 'يستمع إليك الآن' : 'متصل وجاهز'}</span>
            </div>
          </div>

          {/* Sound Waves Animation */}
          <div className="flex items-center gap-1.5 h-10 my-2">
            {audioLevel.map((height, idx) => (
              <span
                key={idx}
                style={{ height: `${height}px` }}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  isSpeakingAgent
                    ? 'bg-amber-500'
                    : isListeningMic
                    ? 'bg-emerald-500'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          <p className="text-xs font-bold text-slate-700 mt-1">{statusText}</p>

          {/* Big Mic Controls */}
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={toggleMic}
              className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                isListeningMic
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/25'
              }`}
            >
              {isListeningMic ? (
                <>
                  <Mic className="w-5 h-5 animate-bounce" />
                  <span>جارٍ الاستماع.. اضغط للتوقف</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>تحدث بصوتك الآن 🎙️</span>
                </>
              )}
            </button>

            {isSpeakingAgent && (
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsSpeakingAgent(false);
                }}
                className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                title="إيقاف صوت المساعد"
              >
                <VolumeX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Conversation Transcript */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[160px] max-h-[240px]">
          {transcript.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs overflow-hidden ${
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-100 border border-amber-300 p-0.5'
                }`}
              >
                {msg.role === 'user' ? (
                  '👦'
                ) : (
                  <img
                    src="/assets/aistudio/Cheerful_School_Mascots_and_Smart_Assistant_fa100797.png"
                    alt="مساعدي"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                    : 'bg-white text-slate-800 border border-amber-200/80 rounded-tl-xs shadow-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Text Fallback Input */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendUserMessage(textInput);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="أو اكتب سؤالك وسأجيبك بالصوت فوراً..."
              className="flex-1 p-3 rounded-xl border border-slate-200 text-xs sm:text-sm outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إرسال</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
