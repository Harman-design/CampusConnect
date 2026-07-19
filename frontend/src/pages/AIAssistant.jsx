import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  HiOutlineChatAlt2,
  HiOutlineDocumentText,
  HiOutlineQuestionMarkCircle,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineBriefcase,
  HiOutlineLightBulb,
  HiOutlinePaperAirplane,
  HiOutlineMicrophone,
  HiOutlinePlus,
  HiOutlineTerminal,
  HiSparkles
} from 'react-icons/hi';
import {
  aiChat,
  aiSummarize,
  aiGenerateQuiz,
  aiGenerateViva,
  aiAnalyzePyqs,
  aiInterviewPrep,
  aiImportantQuestions,
} from '../services/aiService';
import { TextInput } from '../components/FormField';
import { SelectInput } from '../components/SelectInput';

const TABS = [
  { key: 'chat', label: 'AI Chat Copilot', icon: HiOutlineChatAlt2 },
  { key: 'summarize', label: 'PDF Summarizer', icon: HiOutlineDocumentText },
  { key: 'quiz', label: 'Quiz Generator', icon: HiOutlineQuestionMarkCircle },
  { key: 'viva', label: 'Viva prep questions', icon: HiOutlineAcademicCap },
  { key: 'pyq', label: 'PYQ analysis model', icon: HiOutlineChartBar },
  { key: 'interview', label: 'OA & Interview prep', icon: HiOutlineBriefcase },
  { key: 'important', label: 'Syllabus Highlights', icon: HiOutlineLightBulb },
];

const SUGGESTED_PROMPTS = [
  "Explain the difference between SQL and NoSQL databases",
  "Design a 5-day study plan for Operating Systems final exam",
  "Provide common technical interview questions for a React developer role"
];

function renderMarkdown(content) {
  if (!content) return '';
  let parsed = content;
  
  // Code blocks
  parsed = parsed.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // Inline code
  parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Lists
  parsed = parsed.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
  // Math blocks $$formula$$
  parsed = parsed.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="my-2 p-2 bg-[#0B1220] rounded border border-slate-800 text-center font-mono text-[#4F8CFF]">$1</div>');
  
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: parsed }} />;
}

export default function AIAssistant() {
  const [tab, setTab] = useState('chat');
  const [chatHistoryList, setChatHistoryList] = useState(() => {
    const cached = localStorage.getItem('ai_chat_sessions');
    return cached ? JSON.parse(cached) : [
      { id: '1', title: 'Data Structures Viva study' },
      { id: '2', title: 'ATS Resume optimizations' },
      { id: '3', title: 'Cycle Test math syllabus' }
    ];
  });
  const [activeSessionId, setActiveSessionId] = useState('1');

  useEffect(() => {
    localStorage.setItem('ai_chat_sessions', JSON.stringify(chatHistoryList));
  }, [chatHistoryList]);

  const createNewChat = () => {
    const newChat = {
      id: String(Date.now()),
      title: `Conversation ${chatHistoryList.length + 1}`
    };
    setChatHistoryList([newChat, ...chatHistoryList]);
    setActiveSessionId(newChat.id);
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] text-slate-100 bg-[#0B1220]">
      {/* AI Left Sidebar for Conversation history list */}
      <aside className="w-60 border-r border-slate-800 bg-[#111827] p-4 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-4">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-[#1e293b]/80 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#4F8CFF] transition"
          >
            <HiOutlinePlus className="h-4 w-4" />
            <span>New Chat Thread</span>
          </button>
          
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Conversation history</span>
            <div className="space-y-1 overflow-y-auto max-h-[300px]">
              {chatHistoryList.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveSessionId(chat.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs truncate transition block ${
                    activeSessionId === chat.id 
                      ? 'bg-[#1E293B] text-[#4F8CFF] font-bold border border-slate-850' 
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  {chat.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gemini branding badge */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED]/10 to-[#4F8CFF]/5 border border-[#7C3AED]/15 flex items-center gap-2">
          <HiSparkles className="h-4.5 w-4.5 text-[#7C3AED] animate-pulse" />
          <span className="text-[10px] font-bold text-[#94A3B8]">Gemini Flash API</span>
        </div>
      </aside>

      {/* Main Container pane */}
      <div className="flex-1 flex flex-col p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto text-left">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <HiSparkles className="h-6.5 w-6.5 text-[#7C3AED]" />
            <span>AI Academic Assistant</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">Powered by Gemini AI. Chat, build PDF study summaries, generate Viva question banks, or analyze PYQs.</p>
        </div>

        {/* Tab Console Selector dropdown on mobile/list on desktop */}
        <div className="flex flex-wrap gap-1.5 bg-[#111827] border border-slate-800 p-1 rounded-xl w-fit">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                tab === key ? 'bg-[#1E293B] text-[#4F8CFF] border border-slate-850 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Content Tabs Area */}
        <div className="flex-1">
          {tab === 'chat' && <ChatTool activeSessionId={activeSessionId} />}
          {tab === 'summarize' && <SummarizeTool />}
          {tab === 'quiz' && <QuizTool />}
          {tab === 'viva' && <VivaTool />}
          {tab === 'pyq' && <PyqAnalysisTool />}
          {tab === 'interview' && <InterviewPrepTool />}
          {tab === 'important' && <ImportantQuestionsTool />}
        </div>
      </div>
    </div>
  );
}

function ToolCard({ children }) {
  return <div className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-premium flex flex-col">{children}</div>;
}

function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p className="mt-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 p-3 text-xs text-[#EF4444] font-medium">
      {error.response?.data?.message || error.message}
    </p>
  );
}

// ---------------- AI Chat Tool ----------------
function ChatTool({ activeSessionId }) {
  const [sessionMessages, setSessionMessages] = useState({});
  const [input, setInput] = useState('');

  const messages = sessionMessages[activeSessionId] || [];

  const mutation = useMutation({
    mutationFn: ({ message, history }) => aiChat(message, history),
  });

  const handleSend = (val) => {
    const textToSend = val || input;
    if (!textToSend.trim()) return;
    
    const userMessage = { role: 'user', content: textToSend };
    const currentHistory = [...messages];
    const updatedMessages = [...currentHistory, userMessage];
    
    setSessionMessages(prev => ({
      ...prev,
      [activeSessionId]: updatedMessages
    }));
    setInput('');

    mutation.mutate(
      { message: userMessage.content, history: currentHistory },
      {
        onSuccess: (reply) => {
          setSessionMessages(prev => ({
            ...prev,
            [activeSessionId]: [...updatedMessages, { role: 'model', content: reply }]
          }));
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Chat failed.'),
      }
    );
  };

  const handlePromptClick = (p) => {
    handleSend(p);
  };

  return (
    <ToolCard>
      <div className="flex flex-col h-[400px]">
        {/* Chat message display area */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="h-full flex flex-col justify-center items-center text-center space-y-4 max-w-sm mx-auto">
              <HiOutlineChatAlt2 className="h-10 w-10 text-slate-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-350 uppercase">Start a Conversation</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Ask anything about your syllabus subjects, reference documents, or exam targets. Try the quick suggestions below:</p>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full pt-2">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handlePromptClick(p)}
                    className="p-2.5 text-left rounded-xl bg-[#0B1220]/60 hover:bg-[#0B1220] border border-slate-800 text-[10px] text-slate-400 hover:text-[#4F8CFF] hover:border-[#4F8CFF]/20 transition duration-150"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-2.5 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border border-slate-800 ${
                m.role === 'user' ? 'bg-[#4F8CFF]/25 text-[#4F8CFF]' : 'bg-[#7C3AED]/20 text-[#7C3AED]'
              }`}>
                {m.role === 'user' ? 'ME' : 'AI'}
              </div>
              <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                m.role === 'user' 
                  ? 'chat-bubble-user font-medium shadow-md' 
                  : 'chat-bubble-model'
              }`}>
                {m.role === 'user' ? m.content : renderMarkdown(m.content)}
              </div>
            </div>
          ))}

          {mutation.isPending && (
            <div className="flex items-start gap-2.5 max-w-[85%]">
              <div className="h-8 w-8 rounded-full bg-[#7C3AED]/20 border border-slate-800 text-xs font-bold flex items-center justify-center text-[#7C3AED]">
                AI
              </div>
              <div className="chat-bubble-model rounded-2xl px-4 py-2.5 text-xs text-[#94A3B8] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="mt-4 pt-3 border-t border-slate-800/40 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI study planner a question..."
            className="flex-1 rounded-xl bg-[#0B1220] border border-slate-800 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#4F8CFF] transition duration-200"
            disabled={mutation.isPending}
          />
          <button
            type="button"
            className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-[#0B1220] text-slate-400 hover:text-white transition duration-150"
            title="Voice Input Mockup"
          >
            <HiOutlineMicrophone className="h-4.5 w-4.5" />
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !input.trim()}
            className="flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] hover:opacity-95 text-white disabled:opacity-40 shadow transition duration-150"
          >
            <HiOutlinePaperAirplane className="h-4.5 w-4.5 rotate-90" />
          </button>
        </form>
      </div>
    </ToolCard>
  );
}

// ---------------- Summarizer ----------------
function SummarizeTool() {
  const [text, setText] = useState('');
  const [length, setLength] = useState('medium');
  const mutation = useMutation({ mutationFn: aiSummarize });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return toast.error('Paste some notes to summarize.');
    mutation.mutate({ text, length });
  };

  return (
    <ToolCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Paste your syllabus text or study notes copy here to generate summaries..."
          className="w-full rounded-xl bg-[#0B1220] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F8CFF] transition"
        />
        <div className="flex gap-3 justify-between items-center">
          <div className="w-40">
            <SelectInput placeholder="Summary length" value={length} onChange={(e) => setLength(e.target.value)} options={['short', 'medium', 'detailed']} />
          </div>
          <button type="submit" disabled={mutation.isPending} className="rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] px-4 py-2 text-xs font-bold text-white hover:opacity-95 shadow transition disabled:opacity-40">
            {mutation.isPending ? 'Summarizing...' : 'Summarize Text'}
          </button>
        </div>
      </form>

      <ErrorNote error={mutation.error} />

      {mutation.data && (
        <div className="mt-4 p-4 rounded-xl bg-[#0B1220]/60 border border-slate-850 space-y-3">
          <h4 className="text-xs font-bold text-[#4F8CFF] uppercase tracking-wider">Summary Output</h4>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">{mutation.data.summary}</p>
          {mutation.data.keyPoints && mutation.data.keyPoints.length > 0 && (
            <div className="pt-3 border-t border-slate-800/40">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Key Takeaways</span>
              <ul className="list-disc pl-5 text-xs text-slate-350 space-y-1.5 font-sans">
                {mutation.data.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </ToolCard>
  );
}

// ---------------- Quiz Generator ----------------
function QuizTool() {
  const [form, setForm] = useState({ topic: '', text: '', numQuestions: 5, difficulty: 'medium' });
  const mutation = useMutation({ mutationFn: aiGenerateQuiz });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.topic) return toast.error('Enter a topic.');
    mutation.mutate({ ...form, numQuestions: Number(form.numQuestions) });
  };

  return (
    <ToolCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput placeholder="Topic (e.g. Memory Management, BST)" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        <textarea
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          rows={4}
          placeholder="Optional: paste textbook source paragraphs for custom questions"
          className="w-full rounded-xl bg-[#0B1220] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F8CFF] transition"
        />
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-2">
            <TextInput type="number" min={1} max={20} value={form.numQuestions} onChange={(e) => setForm({ ...form, numQuestions: e.target.value })} className="w-24 text-center" />
            <div className="w-36">
              <SelectInput placeholder="Difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} options={['easy', 'medium', 'hard']} />
            </div>
          </div>
          <button type="submit" disabled={mutation.isPending} className="rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] px-4 py-2 text-xs font-bold text-white hover:opacity-95 shadow transition disabled:opacity-40">
            {mutation.isPending ? 'Generating...' : 'Generate MCQ Quiz'}
          </button>
        </div>
      </form>

      <ErrorNote error={mutation.error} />

      {mutation.data && (
        <div className="mt-5 space-y-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Generated Quiz Questions</span>
          {mutation.data.questions?.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-[#0B1220]/40 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-100 font-sans">
                {i + 1}. {q.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {q.options?.map((opt, j) => (
                  <div key={j} className={`rounded-xl px-3.5 py-2 border ${j === q.correctAnswerIndex ? 'bg-[#22C55E]/5 border-[#22C55E]/20 text-[#22C55E]' : 'bg-[#111827] border-slate-850 text-slate-400'}`}>
                    <strong>{String.fromCharCode(65 + j)}.</strong> {opt}
                  </div>
                ))}
              </div>
              {q.explanation && <p className="text-[10px] text-slate-500 font-medium font-sans border-t border-slate-800/40 pt-2">{q.explanation}</p>}
            </div>
          ))}
        </div>
      )}
    </ToolCard>
  );
}

// ---------------- Viva Questions ----------------
function VivaTool() {
  const [form, setForm] = useState({ subject: '', topic: '', numQuestions: 8 });
  const mutation = useMutation({ mutationFn: aiGenerateViva });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject) return toast.error('Enter a subject.');
    mutation.mutate({ ...form, numQuestions: Number(form.numQuestions) });
  };

  return (
    <ToolCard>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextInput placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <TextInput placeholder="Topic/Unit (optional)" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
        <TextInput type="number" min={1} max={20} value={form.numQuestions} onChange={(e) => setForm({ ...form, numQuestions: e.target.value })} />
        <button type="submit" disabled={mutation.isPending} className="sm:col-span-3 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] py-2 text-xs font-bold text-white hover:opacity-95 shadow transition disabled:opacity-40">
          {mutation.isPending ? 'Generating...' : 'Generate Viva Practice Sheets'}
        </button>
      </form>

      <ErrorNote error={mutation.error} />

      {mutation.data && (
        <div className="mt-5 space-y-3.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Generated Questions & Model Answers</span>
          {mutation.data.questions?.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-[#0B1220]/40 p-4 space-y-2 text-xs font-sans">
              <p className="font-extrabold text-slate-200">Q{i + 1}. {q.question}</p>
              <p className="text-slate-400 border-l-2 border-[#7C3AED] pl-3.5 mt-1 text-[11px] leading-relaxed">{q.modelAnswer}</p>
            </div>
          ))}
        </div>
      )}
    </ToolCard>
  );
}

// ---------------- PYQ Analysis ----------------
function PyqAnalysisTool() {
  const [form, setForm] = useState({ subject: '', department: '', semester: '' });
  const mutation = useMutation({ mutationFn: aiAnalyzePyqs });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject) return toast.error('Enter a subject.');
    mutation.mutate({ ...form, semester: form.semester ? Number(form.semester) : undefined });
  };

  return (
    <ToolCard>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextInput placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <TextInput placeholder="Department (optional)" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        <TextInput type="number" min={1} max={10} placeholder="Semester (optional)" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
        <button type="submit" disabled={mutation.isPending} className="sm:col-span-3 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] py-2 text-xs font-bold text-white hover:opacity-95 shadow transition disabled:opacity-40">
          {mutation.isPending ? 'Analyzing...' : 'Run PYQ Diagnostics'}
        </button>
      </form>

      <ErrorNote error={mutation.error} />

      {mutation.data && (
        <div className="mt-5 space-y-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Based on {mutation.data.recordsAnalyzed} PYQ record(s) on file.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="bg-[#0B1220]/60 p-4 border border-slate-800 rounded-xl space-y-2">
              <h4 className="font-extrabold text-[#F59E0B] flex items-center gap-1.5">
                <HiOutlineLightBulb className="h-4.5 w-4.5" /> Important Topics
              </h4>
              <ul className="list-disc pl-5 text-slate-350 space-y-1.5 text-[11px]">
                {mutation.data.likelyImportantTopics?.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-[#0B1220]/60 p-4 border border-slate-800 rounded-xl space-y-2">
              <h4 className="font-extrabold text-[#4F8CFF] flex items-center gap-1.5">
                <HiOutlineTerminal className="h-4.5 w-4.5" /> Exam Pattern Insights
              </h4>
              <p className="text-slate-350 leading-relaxed text-[11px]">{mutation.data.examPatternInsights}</p>
            </div>
          </div>
          
          <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 p-4 rounded-xl text-xs font-sans text-slate-200">
            <strong className="text-[#22C55E] font-bold block uppercase tracking-wider text-[10px] mb-1">Recommendation</strong>
            <p className="leading-relaxed text-[11px]">{mutation.data.recommendation}</p>
          </div>
        </div>
      )}
    </ToolCard>
  );
}

// ---------------- Interview Prep ----------------
function InterviewPrepTool() {
  const [form, setForm] = useState({ role: '', companyName: '', jobDescription: '' });
  const mutation = useMutation({ mutationFn: aiInterviewPrep });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.role) return toast.error('Enter a target role.');
    mutation.mutate(form);
  };

  return (
    <ToolCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextInput placeholder="Target Role (e.g. SDE Intern)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <TextInput placeholder="Company Name (e.g. Amazon, Zoho)" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
        </div>
        <textarea
          value={form.jobDescription}
          onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
          rows={4}
          placeholder="Paste Job Description / eligibility details here..."
          className="w-full rounded-xl bg-[#0B1220] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F8CFF] transition"
        />
        <button type="submit" disabled={mutation.isPending} className="rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] px-4 py-2 text-xs font-bold text-white hover:opacity-95 shadow transition disabled:opacity-40">
          {mutation.isPending ? 'Preparing...' : 'Create Study Prep Kit'}
        </button>
      </form>

      <ErrorNote error={mutation.error} />

      {mutation.data && (
        <div className="mt-5 space-y-4 text-xs font-sans">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0B1220]/60 p-4 border border-slate-800 rounded-xl space-y-2">
              <h4 className="font-extrabold text-[#4F8CFF]">Technical interview questions</h4>
              <ul className="list-disc pl-5 text-slate-350 space-y-1.5 text-[11px]">
                {mutation.data.technicalQuestions?.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-[#0B1220]/60 p-4 border border-slate-800 rounded-xl space-y-2">
              <h4 className="font-extrabold text-[#7C3AED]">HR & Behavior questions</h4>
              <ul className="list-disc pl-5 text-slate-350 space-y-1.5 text-[11px]">
                {mutation.data.hrQuestions?.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl">
            <strong className="text-slate-300 block uppercase tracking-wider text-[9px] mb-2">Preparation Tips</strong>
            <ul className="list-disc pl-5 text-slate-400 space-y-1 text-[11px] leading-relaxed">
              {mutation.data.tips?.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </ToolCard>
  );
}

// ---------------- Important Questions ----------------
function ImportantQuestionsTool() {
  const [form, setForm] = useState({ subject: '', unit: '', text: '' });
  const mutation = useMutation({ mutationFn: aiImportantQuestions });

  const IMPORTANCE_STYLES = { 
    high: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/20', 
    medium: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20', 
    low: 'bg-slate-800 text-slate-400 border border-slate-700' 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject) return toast.error('Enter a subject.');
    mutation.mutate(form);
  };

  return (
    <ToolCard>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextInput placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <TextInput placeholder="Unit (optional)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </div>
        <textarea
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          rows={4}
          placeholder="Optional: paste notes for custom syllabus analysis..."
          className="w-full rounded-xl bg-[#0B1220] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4F8CFF] transition"
        />
        <button type="submit" disabled={mutation.isPending} className="rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#7C3AED] px-4 py-2 text-xs font-bold text-white hover:opacity-95 shadow transition disabled:opacity-40">
          {mutation.isPending ? 'Generating...' : 'Predict Syllabus Questions'}
        </button>
      </form>

      <ErrorNote error={mutation.error} />

      {mutation.data && (
        <div className="mt-5 space-y-3.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Predicted Important Questions</span>
          {mutation.data.questions?.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-[#0B1220]/40 p-4 space-y-2.5 text-xs font-sans">
              <div className="flex items-start justify-between gap-3">
                <p className="font-extrabold text-slate-200">{q.question}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${IMPORTANCE_STYLES[q.importance]}`}>{q.importance}</span>
              </div>
              {q.reason && <p className="text-slate-500 text-[11px] leading-relaxed border-t border-slate-800/40 pt-2 mt-1">{q.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </ToolCard>
  );
}
