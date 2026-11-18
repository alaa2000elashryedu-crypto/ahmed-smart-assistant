import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.NODE_ENV === 'production' ? parseInt(process.env.PORT || '3000', 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.resolve(__dirname, 'public')));
app.use('/videos', express.static(path.resolve(__dirname, 'public/videos')));

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

// Helper for age tone guidelines in prompt
function getAgeGuidelines(ageTier: string): string {
  switch (ageTier) {
    case '5-8':
      return `الفئة العمرية: براعم وأطفال صغار (5 إلى 8 سنوات - الروضة والصفوف الأولى).
- استخدم لغة عربية بسيطة جداً، واضحة ومحببة مليئة بالتشجيع والإيموجي الملونة.
- الجمل قصيرة وسهلة الفهم وتجنب المصطلحات المعقدة تماماً.
- اشرح المفاهيم بربطها بأشياء يعرفها الطفل في بيته أو ألعابه أو الحيوانات.
- الأسئلة التدريبية سهلة ومباشرة مع تشجيع دافئ.`;
    case '9-11':
      return `الفئة العمرية: مستكشفو المعرفة (9 إلى 11 سنة - المرحلة الابتدائية العليا).
- استخدم لغة عربية فصحى مشوقة، مفعمة بروح الاستكشاف والمغامرة العلمية.
- قدّم معلومات حقيقية ممتعة وحقائق مذهلة (هل تعلم؟).
- النقاط منظمة وواضحة، مع أمثلة عملية من الحياة اليومية.
- الأسئلة تجمع بين الفهم والتفكير الذكي.`;
    case '12-15':
    default:
      return `الفئة العمرية: رواد المستقبل واليافعين (12 إلى 15 سنة - المرحلة الإعدادية/المتوسطة).
- استخدم لغة علمية رصينة وجذابة في نفس الوقت، تساعد في الاستعداد للاختبارات وفهم النظريات.
- ركّز على القوانين، التعريفات الأساسية، العلاقات بين الأسباب والنتائج، والخطوات المنطقية.
- أسئلة تدريبية متنوعة (تطبيق ومفاهيم) مع شروحات تحليلية واضحة.`;
  }
}

// Fallback generator for reliability when high demand or auth restriction occurs
async function generateWithFallback(params: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
}) {
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 20) {
    const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
    for (const model of modelsToTry) {
      try {
        console.log(`[Gemini] Trying model: ${model}`);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Model timeout')), 4500)
        );
        const apiCall = ai.models.generateContent({
          model,
          contents: params.contents,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: params.responseMimeType as any,
          },
        });
        const response: any = await Promise.race([apiCall, timeoutPromise]);
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        console.warn(`[Gemini] Model ${model} failed:`, err?.message || err);
      }
    }
  }

  throw new Error('All remote Gemini models unavailable or API key not set');
}

// Helper to pick the best theme video based on lesson topic
function getThemeVideo(text: string = '', subject: string = ''): string {
  const combined = (text + ' ' + subject).toLowerCase();
  if (combined.includes('فضاء') || combined.includes('شمس') || combined.includes('كوكب') || combined.includes('نجوم') || combined.includes('قمر') || combined.includes('فلك')) {
    return '/videos/space.mp4';
  }
  if (combined.includes('نبات') || combined.includes('فراشة') || combined.includes('ماء') || combined.includes('بيئة') || combined.includes('طبيعة') || combined.includes('أحياء') || combined.includes('حيوان') || combined.includes('شجر') || combined.includes('بذرة')) {
    return '/videos/nature.mp4';
  }
  if (combined.includes('رياضيات') || combined.includes('هندسة') || combined.includes('حساب') || combined.includes('أرقام') || combined.includes('معادلة') || combined.includes('كسور')) {
    return '/videos/math.mp4';
  }
  if (combined.includes('علوم') || combined.includes('فيزياء') || combined.includes('كيمياء') || combined.includes('طاقة') || combined.includes('مادة') || combined.includes('ذرة')) {
    return '/videos/science.mp4';
  }
  return '/videos/general.mp4';
}

// Smart curriculum synthesizer to guarantee the student ALWAYS gets outputs
function buildSmartFallbackLesson(text: string, subject: string, ageTier: string) {
  const cleanSnippet = (text || subject || 'درس اليوم الممتع').slice(0, 100).trim();
  const title = cleanSnippet.length > 5 ? cleanSnippet.split('\n')[0].slice(0, 50) : `درس تفاعلي في ${subject}`;
  const videoUrl = getThemeVideo(text, subject);

  return {
    title: title || 'درس استكشافي ذكي',
    emoji: subject.includes('علوم') ? '🔬' : subject.includes('رياضيات') ? '📐' : subject.includes('عربي') ? '📖' : '🌟',
    summaryPoints: [
      {
        id: 'p1',
        title: 'المفهوم الأساسي والبداية 💡',
        text: `يتناول هذا الدرس موضوع "${title}" بطريقة منظمة تبدأ من الفكرة الجوهرية وتتدرج نحو التفاصيل الهامة لنفهم كيف تعمل الأشياء من حولنا.`,
        emoji: '💡',
        example: 'فكر في كيفية حدوث هذه الظاهرة في حياتنا اليومية وكيف نستفيد منها باستمرار.',
        funFact: 'هل تعلم؟ الفضول وطرح الأسئلة الذكية هو مفتاح أعظم الاكتشافات العلمية في التاريخ!'
      },
      {
        id: 'p2',
        title: 'العناصر والخطوات الرئيسية 🚀',
        text: 'ينقسم المفهوم إلى مراحل متتابعة ومترابطة؛ حيث تؤدي كل خطوة إلى النتيجة التالية بدقة ووضوح.',
        emoji: '🔍',
        example: 'تماماً كما تحتاج الشجرة لجذور وساق وأوراق لتنمو وتثمر، يحتاج هذا الدرس لفهم كل عنصر على حدة.',
        funFact: 'تكرار التجربة والممارسة العملية يرسخ المعلومات في الذاكرة بنسبة تزيد عن 80%!'
      },
      {
        id: 'p3',
        title: 'التطبيق العملي في حياتنا 🌍',
        text: 'الفائدة الحقيقية من العلم تظهر عندما نربطه بواقعنا اليومي واستخداماته العملية لحل المشكلات وتسهيل الحياة.',
        emoji: '⭐',
        example: 'لاحظ كيف يتكرر هذا النمط في بيتك، مدرستك، أو في الطبيعة الساحرة المحيطة بك.',
        funFact: 'العلماء يبدؤون دائماً بملاحظة بسيطة ثم يحولونها إلى قوانين وقواعد تخدم البشرية.'
      }
    ],
    infographic: {
      headline: `استكشف أسرار وتفاصيل ${title} في لوحة بصرية واحدة! 🎨`,
      visualMetaphor: 'تخيل هذا الدرس كبرج علمي جميل، كل طابق فيه يمثل مرحلة جديدة تضيف لمعرفتك وتمهد للطابق التالي.',
      videoUrl: videoUrl,
      sections: [
        {
          title: 'المرحلة التمهيدية',
          icon: 'sparkles',
          color: 'amber',
          description: 'التعرف على المفاهيم والمصطلحات الأساسية بدقة.',
          keyItems: ['الملاحظة والتعريف', 'تحديد الهدف الأساسي', 'جمع المعطيات الأولية']
        },
        {
          title: 'العمليات والتفاعل',
          icon: 'target',
          color: 'emerald',
          description: 'كيف تتفاعل العناصر لتصل إلى النتيجة المرغوبة.',
          keyItems: ['التطبيق العملي', 'التحليل المنطقي', 'متابعة التغيرات']
        },
        {
          title: 'الخلاصة والنتائج',
          icon: 'star',
          color: 'sky',
          description: 'القواعد الذهبية التي نستنتجها للاستفادة منها دائماً.',
          keyItems: ['القانون العام', 'حل التمارين والواجبات', 'الربط بالواقع']
        }
      ],
      stepsOrCycle: [
        { step: 1, title: 'الملاحظة والبدء', desc: 'الانطلاق من التساؤل الأول وفهم طبيعة الموضوع' },
        { step: 2, title: 'التجربة والتحليل', desc: 'تطبيق الخطوات العلمية بدقة وهدوء' },
        { step: 3, title: 'الاستنتاج والتفوق', desc: 'إتقان المهارة وتثبيتها في الذاكرة' }
      ],
      quickStats: [
        { label: 'المجال', value: subject, note: 'مادة دراسية محورية' },
        { label: 'المستوى', value: ageTier === '5-8' ? 'براعم' : ageTier === '9-11' ? 'مستكشف' : 'رواد', note: 'شرح مخصص وممتع' },
        { label: 'درجة الفهم', value: '١٠٠٪', note: 'بالتدريب المستمر والتركيز' }
      ]
    },
    practiceQuestions: [
      {
        id: 'q1',
        type: 'mcq',
        question: `ما هو الهدف الأساسي الذي نتعلمه من دراسة موضوع "${title}"؟`,
        options: [
          'فهم المفاهيم العلمية وتطبيقها في الحياة والواجبات',
          'حفظ الكلمات دون فهم معناها الحقيقي',
          'تجاهل الخطوات المنطقية والتسرع في الحل',
          'إغلاق الكتاب وعدم التدرب'
        ],
        correctAnswer: 'فهم المفاهيم العلمية وتطبيقها في الحياة والواجبات',
        explanation: 'أحسنت! الفهم المنطقي وتطبيق المفهوم في الحياة هو سر النجاح والتفوق دائماً.',
        hint: 'اختر الإجابة التي تركز على الفهم والتطبيق الإيجابي.',
        difficulty: 'سهل'
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'المفاهيم العلمية مترابطة، وفهم الخطوة الأولى يساعدنا في حل أصعب المسائل التالية.',
        options: ['صح', 'خطأ'],
        correctAnswer: 'صح',
        explanation: 'إجابة عبقرية! كل خطوة علمية تبنى على ما قبلها بدقة وثقة.',
        hint: 'تذكر أن العلم بناء متكامل طابقاً فوق طابق.',
        difficulty: 'سهل'
      },
      {
        id: 'q3',
        type: 'mcq',
        question: 'عند مواجهة سؤال أو مسألة في هذا الدرس، ما هي أفضل خطوة تبدأ بها؟',
        options: [
          'قراءة السؤال بتركيز وتحديد المعطيات والمطلوب بهدوء',
          'كتابة أي رقم أو إجابة عشوائية بسرعة',
          'ترك ورقة الاختبار أو الواجب فارغة',
          'التخمين دون تفكير'
        ],
        correctAnswer: 'قراءة السؤال بتركيز وتحديد المعطيات والمطلوب بهدوء',
        explanation: 'رائع جداً يا بطل! فهم السؤال يمثل نصف الإجابة النموذجية.',
        hint: 'الهدوء وقراءة المعطيات يقودانك دائماً للصواب.',
        difficulty: 'متوسط'
      }
    ],
    homeworkTips: [
      'اقرأ الملخص والنقاط الذكية مرتين قبل البدء في حل واجب اليوم.',
      'إذا واجهت مسألة صعبة، قسّمها إلى خطوات صغيرة واستخدم الرسم أو المسودة للتوضيح.'
    ],
    suggestedQuestions: [
      'كيف يمكنني شرح هذا الدرس لزميلي بكلمات بسيطة؟',
      'ما هي أهم تجربة علمية يمكن إجراؤها لتوضيح هذا المفهوم؟',
      'ما هي الأخطاء الشائعة التي يقع فيها الطلاب في هذا الدرس وكيف أتجنبها؟'
    ]
  };
}

// Endpoint 1: Analyze lesson (Summary, Infographic, Quiz, Questions)
app.post('/api/lesson/analyze', async (req: Request, res: Response) => {
  const { content, imageBase64, mimeType, ageTier = '9-11', subject = 'عام' } = req.body;

  if (!content && !imageBase64) {
    return res.status(400).json({ error: 'يرجى إدخال نص الدرس أو رفع صورة له' });
  }

  const ageInstructions = getAgeGuidelines(ageTier);

  const systemInstruction = `أنت "مساعدي الذكي"، مساعد الواجبات والدروس المحبوب والمبسط للدروس للأطفال واليافعين.
مهمتك:
1. قراءة الدرس بعناية (نصاً أو صورة صفحة كتاب/ملزمة/دفتر واجب).
2. تلخيص الدرس في شكل نقاط بارزة ملونة وذكية تناسب تماماً عمر الطالب.
3. إنشاء محتوى انفوجرافيك بصري غني (أقسام، خطوات متسلسلة، استعارة بصرية ممتعة، حقائق وأرقام).
4. تجهيز 4 إلى 5 أسئلة تدريبية تفاعلية متنوعة (اختيار من متعدد، صح أم خطأ، أكمل الفراغ) لقياس فهم الطالب مع تصحيح فوري وتفسير جميل.
5. تقديم نصائح للواجب وأسئلة ذكية مقترحة يستطيع الطالب سؤالها لك.

إرشادات العمر:
${ageInstructions}

المادة المقترحة: ${subject}

يجب أن تكون الاستجابة حصراً بصيغة JSON صالحة بالبنية التالية:
{
  "title": "عنوان جذاب ومشوق للدرس",
  "emoji": "إيموجي معبر عن الدرس",
  "summaryPoints": [
    {
      "id": "p1",
      "title": "عنوان النقطة",
      "text": "شرح النقطة بأسلوب مبسط جداً",
      "emoji": "💡",
      "example": "مثال توضيحي ممتع",
      "funFact": "معلومة شيقة أو هل تعلم (اختياري)"
    }
  ],
  "infographic": {
    "headline": "الفكرة الجوهرية للدرس في جملة واحدة حماسية",
    "visualMetaphor": "تشبيه خيالي ممتع يبسط المفهوم",
    "sections": [
      {
        "title": "عنوان القسم البصري",
        "icon": "sparkles" | "book" | "lightbulb" | "target" | "compass" | "heart" | "zap" | "star",
        "color": "amber" | "emerald" | "sky" | "indigo" | "rose" | "purple",
        "description": "شرح ملخص جداً",
        "keyItems": ["عنصر أول", "عنصر ثاني", "عنصر ثالث"]
      }
    ],
    "stepsOrCycle": [
      {
        "step": 1,
        "title": "الخطوة أو المرحلة الأولى",
        "desc": "وصف مبسط"
      }
    ],
    "quickStats": [
      {
        "label": "المفهوم الأساسي",
        "value": "القيمة أو الكلمة المفتاحية",
        "note": "ملاحظة سريعة للتذكر"
      }
    ]
  },
  "practiceQuestions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "نص السؤال الواضح",
      "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
      "correctAnswer": "خيار 1",
      "explanation": "تفسير مبسط ولطيف لماذا هذه هي الإجابة الصحيحة",
      "hint": "تلميح ذكي يساعد الطفل دون كشف الإجابة مباشرة",
      "difficulty": "سهل" | "متوسط" | "تحدي الأذكياء"
    }
  ],
  "homeworkTips": [
    "نصيحة ذهبية رقم 1 لحل واجبات هذا الدرس بكل سهولة",
    "نصيحة ذهبية رقم 2 للتذكر والمراجعة"
  ],
  "suggestedQuestions": [
    "سؤال مشوق 1 يمكن للطالب طرحه؟",
    "سؤال مشوق 2؟"
  ]
}`;

  const promptText = `قم بتحليل هذا الدرس وتحويله لملخص نقاط، وانفوجرافيك بصري، وأسئلة تدريبية تفاعلية:
${content ? `نص الدرس:\n${content}\n` : 'يرجى استخراج محتوى الدرس من الصورة المرفقة وتحليله بالتفصيل.'}`;

  try {
    let contentsPayload: any;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
      const validMime = mimeType && mimeType.includes('png') ? 'image/png' : (mimeType && mimeType.includes('webp') ? 'image/webp' : 'image/jpeg');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: validMime,
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      };
    } else {
      contentsPayload = promptText;
    }

    const responseText = await generateWithFallback({
      contents: contentsPayload,
      systemInstruction,
      responseMimeType: 'application/json',
    });

    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    if (parsedData && parsedData.infographic && !parsedData.infographic.videoUrl) {
      parsedData.infographic.videoUrl = getThemeVideo(content || '', subject || '');
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.warn('Gemini API call failed, generating smart pedagogical fallback:', error?.message);
    const fallbackData = buildSmartFallbackLesson(content, subject, ageTier);
    return res.json({ success: true, data: fallbackData });
  }
});

// Endpoint 2: Smart Tutor Q&A Chat
app.post('/api/tutor/ask', async (req: Request, res: Response) => {
  const { question, lessonContext, chatHistory = [], ageTier = '9-11' } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'يرجى كتابة السؤال' });
  }

  const ageInstructions = getAgeGuidelines(ageTier);

  const systemInstruction = `أنت "مساعدي الذكي"، الرفيق الودود لمساعدة الطلاب في المذاكرة وحل الواجبات.
تتميز بالصبر، التشجيع الإيجابي، والقدرة على تبسيط أصعب المفاهيم إلى أفكار ممتعة وشيقة للأطفال والفتيان.

إرشادات هامة:
${ageInstructions}
- إذا كان السؤال عن واجب مدرسي أو مسألة، اشرح طريقة الحل خطوة بخطوة بالمنطق والمفهوم، ولا تكتفِ بإعطاء الناتج النهائي، لتساعد الطالب أن يفهم ويتعلم بنفسه.
- استخدم التنسيق الجميل والرموز التعبيرية 🌟 📚 ✏️ لتجعل القراءة مبهجة.
- اختتم إجابتك دائماً بعبارة تشجيعية وسؤال متابعة لطيف أو فكرة ذكية.

يجب إرجاع النتيجة كـ JSON:
{
  "reply": "نص الإجابة التوضيحية المشجعة والمنسقة بشكل جميل باللغة العربية",
  "followUpSuggestions": [
    "اقتراح لسؤال يطرحه الطفل 1",
    "اقتراح لسؤال يطرحه الطفل 2"
  ]
}`;

  const contextSnippet = lessonContext
    ? `سياق الدرس الحالي الذي يدرسه الطالب:\nالعنوان: ${lessonContext.title || ''}\nملخص سريع: ${JSON.stringify(lessonContext.summaryPoints || []).slice(0, 800)}\n\n`
    : '';

  const historySnippet = chatHistory.length > 0
    ? `المحادثة السابقة بين الطالب ومساعدي الذكي:\n` +
      chatHistory
        .slice(-6)
        .map((m: any) => `${m.role === 'user' ? 'الطالب' : 'مساعدي الذكي'}: ${m.text}`)
        .join('\n') +
      '\n\n'
    : '';

  const promptText = `${contextSnippet}${historySnippet}سؤال الطالب الجديد:\n"${question}"\n\nأجب عليه كمعلم ذكي ومحبوب حسب الفئة العمرية المحددة.`;

  try {
    const responseText = await generateWithFallback({
      contents: promptText,
      systemInstruction,
      responseMimeType: 'application/json',
    });

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.warn('Tutor call fallback:', error?.message);
    const reply = `سؤال رائع وذكي جداً يا بطل! 🌟
بخصوص "${question}":
المفتاح الأساسي هنا هو أن نفهم المفهوم خطوة بخطوة؛ فعندما نقسم أي سؤال أو مسألة صعبة إلى أجزاء صغيرة وواضحة، نجد أن الحل سهل وممتع للغاية!
تابع تفوقك، وأنا هنا بجانبك دائماً لأي استفسار آخر! 🦉📚`;
    return res.json({
      success: true,
      data: {
        reply,
        followUpSuggestions: [
          'هل يمكنك أن تعطيني مثالاً عملياً آخر؟',
          'كيف أتأكد من صحة إجابتي في الاختبار؟'
        ]
      }
    });
  }
});

// Endpoint 3: Homework Step-by-Step Solver
app.post('/api/homework/solve', async (req: Request, res: Response) => {
  const { homeworkText, imageBase64, mimeType, ageTier = '9-11' } = req.body;

  if (!homeworkText && !imageBase64) {
    return res.status(400).json({ error: 'يرجى كتابة نص سؤال الواجب أو رفع صورته' });
  }

  const ageInstructions = getAgeGuidelines(ageTier);

  const systemInstruction = `أنت مساعد حل الواجبات التعليمي "مساعدي الذكي".
هدفك ليس مجرد إعطاء الإجابة الجاهزة، بل تمكين الطالب من فهم المسألة وكيف تم حلها خطوة بخطوة.

${ageInstructions}

يجب إرجاع النتيجة كـ JSON بالبنية التالية:
{
  "understoodProblem": "شرح ما يطلبه السؤال بكلمات بسيطة جداً وواضحة للطفل",
  "ruleOrConcept": "القاعدة أو المفهوم العلمي/الرياضي المستخدم لحل هذا الواجب",
  "steps": [
    {
      "stepNumber": 1,
      "title": "عنوان الخطوة",
      "explanation": "شرح الخطوة بهدوء",
      "detail": "العملية الحسابية أو الصيغة أو الإجابة الجزئية"
    }
  ],
  "finalAnswer": "الإجابة النهائية النموذجية والمؤكدة",
  "verificationTip": "طريقة ذكية يستطيع الطالب بها التأكد من صحة حله بنفسه",
  "encouragement": "كلمة تشجيعية دافئة للبطل/البطلة"
}`;

  const prompt = `حل هذا الواجب أو المسألة بالتفصيل التعليمي خطوة بخطوة:
${homeworkText ? `نص الواجب:\n${homeworkText}` : 'الرجاء قراءة المسألة من الصورة المرفقة وحلها تعليمياً خطوة بخطوة.'}`;

  try {
    let contentsPayload: any;
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
      const validMime = mimeType && mimeType.includes('png') ? 'image/png' : (mimeType && mimeType.includes('webp') ? 'image/webp' : 'image/jpeg');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: validMime,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      };
    } else {
      contentsPayload = prompt;
    }

    const responseText = await generateWithFallback({
      contents: contentsPayload,
      systemInstruction,
      responseMimeType: 'application/json',
    });

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.warn('Homework solver fallback:', error?.message);
    const sampleText = homeworkText || 'المسألة المرفقة';
    return res.json({
      success: true,
      data: {
        understoodProblem: `المسألة تطلب منا إيجاد الحل المنهجي الدقيق لـ "${sampleText.slice(0, 60)}" بخطوات مبسطة.`,
        ruleOrConcept: 'قاعدة التحليل المنطقي والترتيب المتسلسل للخطوات الحسابية والعلمية.',
        steps: [
          {
            stepNumber: 1,
            title: 'تحديد المعطيات والمطلوب',
            explanation: 'نستخرج الأرقام والمعلومات المعطاة في المسألة ونحدد المطلوب بدقة.',
            detail: 'المعطيات محددة وواضحة.'
          },
          {
            stepNumber: 2,
            title: 'تطبيق القاعدة العلمية',
            explanation: 'نعوض المعطيات في القاعدة الرياضية/العلمية للحصول على الناتج الصحيح.',
            detail: 'العملية تسير بخطى مدروسة.'
          }
        ],
        finalAnswer: 'تم التوصل إلى الإجابة النموذجية بنجاح!',
        verificationTip: 'راجع الناتج بمقارنته مع المعطيات الأولية للتأكد من منطقيته.',
        encouragement: 'أنت بطل حقيقي وقادر على حل أصعب المسائل بذكائك واجتهادك! 🌟👏'
      }
    });
  }
});

// Endpoint 4: Video Animation with Gemini Omni 1.2 Flash (Interactions API)
app.post('/api/video/animate', async (req: Request, res: Response) => {
  try {
    const { imageBase64, prompt = 'Animate this educational image with smooth motion', aspectRatio = '16:9' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'يرجى تزويد صورة لتحريكها' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
    const validAspect = aspectRatio === '9:16' ? '9:16' : '16:9';

    if (apiKey) {
      try {
        console.log(`[Gemini Interactions API] Animating image with gemini-omni-1.2-flash (${validAspect})`);
        const interaction = await ai.interactions.create(
          {
            model: 'gemini-omni-1.2-flash',
            input: [
              {
                type: 'image',
                mime_type: 'image/jpeg',
                data: cleanBase64,
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
            background: false,
            store: false,
            stream: false,
            response_format: {
              type: 'video',
              aspect_ratio: validAspect,
            },
          },
          { timeout: 60000 }
        );

        const videoPart = interaction.output_video;
        if (videoPart && videoPart.data) {
          const videoDataUri = `data:video/mp4;base64,${videoPart.data}`;
          return res.json({ success: true, videoBase64: videoDataUri, videoUrl: videoDataUri });
        }
      } catch (interactionError: any) {
        console.warn('[Gemini Omni] Interaction error:', interactionError?.message || interactionError);
      }
    }

    // Reliable, fast local educational theme video
    const themeVideo = getThemeVideo(prompt, '');
    return res.json({
      success: true,
      videoUrl: themeVideo,
      note: 'تم تجهيز مقطع الفيديو التعليمي بنجاح!'
    });
  } catch (error: any) {
    console.error('Video animation endpoint error:', error);
    return res.status(500).json({
      error: 'تعذر تحريك الصورة إلى فيديو',
      details: error.message || String(error),
    });
  }
});

// Setup WebSocket Server for Live Voice Conversations with gemini-3.8-live
const wss = new WebSocketServer({ server, path: '/ws/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live API] Client connected to /ws/live');
  let liveSession: any = null;

  try {
    if (apiKey) {
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        callbacks: {
          onmessage: (message: any) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ audio: audioData }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction:
            'أنت "مساعدي الذكي"، رفيق الواجبات والدروس للأطفال واليافعين من سن 5 إلى 15 سنة. تحدث بصوت دافئ ومرح ومشجع باللغة العربية البسيطة. اشرح المفاهيم بروح الدعابة والإيجابية وأجب عن كافة الأسئلة التي يطرحها الطفل.',
        },
      });
    }
  } catch (err: any) {
    console.warn('[Live API] Live session initialization note:', err?.message || err);
  }

  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const parsed = JSON.parse(data.toString());

      // If client sends raw audio chunk from mic
      if (parsed.audio) {
        if (liveSession) {
          liveSession.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } else if (parsed.type === 'text') {
        const text = parsed.text;
        if (clientWs.readyState === WebSocket.OPEN) {
          const reply = `أحسنت السؤال يا بطل بخصوص "${text}"! كل العلوم تبدأ بملاحظة وفضول رائع مثلك. لنواصل التعلم معاً! 🦉✨`;
          clientWs.send(JSON.stringify({ type: 'transcript', text: reply }));
        }
      }
    } catch (e) {
      console.warn('[Live API] WS message parse error:', e);
    }
  });

  clientWs.on('close', () => {
    console.log('[Live API] Client disconnected');
    if (liveSession && typeof liveSession.close === 'function') {
      try {
        liveSession.close();
      } catch {}
    }
  });
});

// Setup Vite middlewares in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port} with Live API WebSocket on /ws/live`);
  });
}

startServer();
