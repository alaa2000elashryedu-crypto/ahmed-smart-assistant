import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Volume2, VolumeX, Bot, User, CornerDownLeft, HelpCircle } from 'lucide-react';
import { ChatMessage, LessonData, AgeTier } from '../types';
import { soundManager, speakArabic, stopSpeaking } from '../utils/audio';

interface TutorChatViewProps {
  lesson: LessonData | null;
  ageTier: AgeTier;
  initialQuestion?: string;
}

export const TutorChatView: React.FC<TutorChatViewProps> = ({
  lesson,
  ageTier,
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: `أهلاً بك يا بطل! أنا "مساعدي الذكي" 🤖✨.
${lesson ? `أنا جاهز للإجابة عن أي سؤال حول درس "${lesson.title}" أو أي مسألة في واجبك المدرسي!` : 'اطرح عليّ أي سؤال في أي مادة، أو مسألة في واجبك، وسأشرحها لك خطوة بخطوة بكل حب وبساطة!'}`,
        timestamp: Date.now(),
        followUpSuggestions: lesson?.suggestedQuestions || [
          'اشرح لي هذا المفهوم كأنني في الخامسة من عمري',
          'أعطني مثالاً ممتعاً من الحياة اليومية',
          'كيف أحل هذه المسألة خطوة بخطوة؟',
        ],
      },
    ];
  });

  const [inputQuestion, setInputQuestion] = useState(initialQuestion || '');
  const [isLoading, setIsLoading] = useState(false);
  const [activeVoiceMsgId, setActiveVoiceMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const questionText = (textToSend || inputQuestion).trim();
    if (!questionText || isLoading) return;

    soundManager.playClick();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: questionText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          lessonContext: lesson ? { title: lesson.title, summaryPoints: lesson.summaryPoints } : undefined,
          chatHistory: messages.map((m) => ({ role: m.role, text: m.text })),
          ageTier,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'فشل في الحصول على رد');
      }

      const botReply = resData.data.reply || 'أحسنت السؤال! دعني أوضح لك ذلك...';
      const suggestions = resData.data.followUpSuggestions || [];

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: botReply,
        timestamp: Date.now(),
        followUpSuggestions: suggestions,
      };

      setMessages((prev) => [...prev, botMsg]);
      soundManager.playCorrect();
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        text: 'عذراً يا صديقي، حدث ارتباك بسيط في الاتصال بمساعدي الذكي. يرجى إعادة المحاولة وسأكون سعيداً بإجابتك فوراً! 🌟',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadMessage = (msg: ChatMessage) => {
    if (activeVoiceMsgId === msg.id) {
      stopSpeaking();
      setActiveVoiceMsgId(null);
      return;
    }
    setActiveVoiceMsgId(msg.id);
    speakArabic(
      msg.text,
      () => setActiveVoiceMsgId(null),
      () => setActiveVoiceMsgId(null)
    );
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[650px] bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white p-1 border-2 border-white/60 shadow-inner overflow-hidden flex items-center justify-center shrink-0">
            <img
              src="/assets/aistudio/Cheerful_School_Mascots_and_Smart_Assistant_fa100797.png"
              alt="مساعدي الذكي"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base leading-snug">مساعدي الذكي</h3>
            <p className="text-xs text-amber-100 font-medium">
              يجيب عن كافة استفساراتك ويبسط الواجبات الصعبة
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-100">متصل الآن ومستعد للمساعدة</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          const isVoiceActive = activeVoiceMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                  isBot ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0 mt-1 shadow-2xs overflow-hidden ${
                    isBot ? 'bg-white p-0.5 border border-amber-300' : 'bg-slate-800 text-white'
                  }`}
                >
                  {isBot ? (
                    <img
                      src="/assets/aistudio/Cheerful_School_Mascots_and_Smart_Assistant_fa100797.png"
                      alt="مساعدي الذكي"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    '👦'
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-3xl text-sm leading-relaxed shadow-2xs ${
                    isBot
                      ? 'bg-white text-slate-800 border border-slate-200/90 rounded-tr-xs'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-tl-xs shadow-amber-500/10'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>

                  {/* Audio read button on bot messages */}
                  {isBot && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <button
                        onClick={() => handleReadMessage(msg)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-all ${
                          isVoiceActive
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800'
                        }`}
                      >
                        {isVoiceActive ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span>{isVoiceActive ? 'إيقاف الصوت' : 'استمع للإجابة 🔊'}</span>
                      </button>
                      <span className="text-[10px]">
                        {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Follow-up suggestions */}
              {isBot && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                <div className="mr-12 mt-2 flex flex-wrap gap-1.5">
                  {msg.followUpSuggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSendMessage(sug)}
                      disabled={isLoading}
                      className="text-xs bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-bold px-3 py-1.5 rounded-full border border-slate-200/80 shadow-2xs transition-all hover:scale-102 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white p-0.5 border border-amber-300 shadow-2xs overflow-hidden flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/Cheerful_School_Mascots_and_Smart_Assistant_fa100797.png"
                alt="مساعدي الذكي"
                className="w-full h-full object-contain animate-pulse"
              />
            </div>
            <div className="p-4 rounded-3xl bg-white border border-slate-200 text-xs font-bold text-slate-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              <span className="mr-2">مساعدي الذكي يفكر ويكتب لك شرحاً جميلاً...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="اسأل مساعدي الذكي عن أي شيء في الدرس أو الواجب..."
            disabled={isLoading}
            className="flex-1 p-3.5 rounded-2xl bg-slate-100 border border-transparent focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-400/20 text-slate-800 placeholder-slate-400 text-sm outline-hidden transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white font-bold text-sm shadow-xs shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>إرسال</span>
            <Send className="w-4 h-4 -rotate-90" />
          </button>
        </form>
      </div>
    </div>
  );
};
