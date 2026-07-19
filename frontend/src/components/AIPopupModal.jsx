import { useState } from 'react';
import { HiX, HiClipboardCopy, HiDownload } from 'react-icons/hi';
import toast from 'react-hot-toast';

function formatMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Headers
  html = html.replace(/^#\s+(.+)$/gm, '<h1 class="text-xl font-extrabold text-slate-800 mt-4 mb-2 border-b pb-1">$1</h1>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-lg font-bold text-slate-800 mt-4 mb-2">$1</h2>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-base font-semibold text-slate-700 mt-3 mb-1">$1</h3>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  
  // Bullets & Lists
  html = html.replace(/^\*\s+(.+)$/gm, '<li class="ml-5 list-disc text-slate-600 text-sm mb-1">$1</li>');
  html = html.replace(/^-\s+(.+)$/gm, '<li class="ml-5 list-disc text-slate-600 text-sm mb-1">$1</li>');
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-5 list-decimal text-slate-600 text-sm mb-1">$1</li>');
  
  // Blockquotes (Viva answers)
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-brand-500 bg-brand-50 p-3 italic text-slate-700 my-2 rounded-r-lg">$1</blockquote>');
  
  // Code Blocks
  html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg my-3 overflow-x-auto text-xs font-mono"><code class="language-$1">$2</code></pre>');
  
  // Paragraph wrap
  const blocks = html.split('\n');
  const processed = blocks.map(line => {
    if (line.trim() === '') return '';
    if (line.startsWith('<h') || line.startsWith('<li') || line.startsWith('<blockquote') || line.startsWith('<pre') || line.startsWith('<code') || line.startsWith('</pre>')) {
      return line;
    }
    return `<p class="text-sm text-slate-600 leading-relaxed mb-2">${line}</p>`;
  });
  
  return processed.join('\n');
}

export default function AIPopupModal({ isOpen, onClose, resource, operation, content, isLoading }) {
  if (!isOpen) return null;

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast.success('AI response copied to clipboard!');
  };

  const handleDownload = () => {
    if (!content) return;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${resource.title}_AI_${operation}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('AI summary downloaded!');
  };

  // Convert operations to readable labels
  const getOpTitle = () => {
    const labels = {
      summarize: 'AI Notes Summary',
      quiz: 'AI Practice Quiz',
      viva: 'AI Viva Questions',
      flashcards: 'AI Flashcards',
      questions: 'AI Exam Questions',
      study_plan: 'AI Study Plan',
      explain_concepts: 'AI Concept Explainer',
      code_explanation: 'AI Code & Implementation Explainer',
      pyq_analysis: 'AI PYQ Exam Analysis',
    };
    return labels[operation] || 'AI Insights Console';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop blur */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white/98 shadow-2xl transition-all flex flex-col h-[75vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">{getOpTitle()}</h3>
            <p className="text-xs text-slate-400">Resource: {resource?.title} · Subject: {resource?.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
          {isLoading ? (
            <div className="flex flex-col h-full items-center justify-center gap-3 text-slate-400">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
              <p className="text-sm font-semibold text-slate-500 animate-pulse">Gemini 1.5 Flash is indexing & processing document...</p>
            </div>
          ) : (
            <div 
              className="prose max-w-none text-slate-700"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
          )}
        </div>

        {/* Footer Actions */}
        {!isLoading && content && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <HiClipboardCopy className="h-4 w-4" />
              Copy Markdown
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
            >
              <HiDownload className="h-4 w-4" />
              Download Markdown
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
