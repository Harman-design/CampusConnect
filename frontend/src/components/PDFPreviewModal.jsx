import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  HiX, 
  HiOutlineEye, 
  HiOutlineExternalLink, 
  HiOutlineZoomIn, 
  HiOutlineZoomOut, 
  HiOutlineArrowsExpand, 
  HiSparkles,
  HiOutlineDocumentText
} from 'react-icons/hi';
import { fetchSimilarResources, registerView, triggerAIContent } from '../services/academicService';
import toast from 'react-hot-toast';

export default function PDFPreviewModal({ isOpen, onClose, resourceId, previewUrl, title, onNavigate }) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('similar'); // similar, ai_summary
  
  // AI summary states
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Query similar resources dynamically when modal is open
  const { data: similarRes } = useQuery({
    queryKey: ['similar-resources', resourceId],
    queryFn: () => fetchSimilarResources(resourceId),
    enabled: isOpen && !!resourceId,
  });

  if (!isOpen) return null;

  const handleSelectSimilar = (item) => {
    registerView(item._id);
    if (onNavigate) {
      onNavigate(item);
    }
  };

  const handleLoadAISummary = async () => {
    setAiLoading(true);
    setAiSummary('');
    try {
      const summary = await triggerAIContent(resourceId, 'summarize');
      setAiSummary(summary);
    } catch (err) {
      toast.error('AI summary calculation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isFullscreen ? 'p-0' : 'p-4 bg-slate-990/70 backdrop-blur-md'}`}>
      
      {/* Backdrop */}
      {!isFullscreen && (
        <div 
          className="fixed inset-0 bg-[#0B1220]/80 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />
      )}

      {/* Split screen modal container */}
      <div className={`relative z-10 w-full bg-[#111827] border border-slate-800 shadow-premium transition-all flex flex-col ${
        isFullscreen ? 'h-screen w-screen rounded-none border-0' : 'max-w-5xl rounded-3xl h-[85vh]'
      }`}>
        
        {/* Header Console */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0B1220]/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4F8CFF]/15 border border-[#4F8CFF]/20 rounded-xl text-[#4F8CFF]">
              <HiOutlineDocumentText className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-slate-100 text-sm line-clamp-1 max-w-lg">{title}</h3>
              <p className="text-[9px] text-[#94A3B8] uppercase font-bold tracking-wider">Embedded Document Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Actions */}
            <div className="hidden sm:flex items-center gap-1 bg-[#1E293B]/70 border border-slate-800 rounded-xl p-0.5">
              <button 
                onClick={() => setZoom(prev => Math.max(50, prev - 10))}
                className="p-1.5 hover:text-white transition text-slate-400"
                title="Zoom Out"
              >
                <HiOutlineZoomOut className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-extrabold text-slate-300 px-1">{zoom}%</span>
              <button 
                onClick={() => setZoom(prev => Math.min(200, prev + 10))}
                className="p-1.5 hover:text-white transition text-slate-400"
                title="Zoom In"
              >
                <HiOutlineZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Fullscreen"
            >
              <HiOutlineArrowsExpand className="h-4 w-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <HiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Split Layout Body */}
        <div className="flex-1 flex overflow-hidden bg-[#0B1220]">
          
          {/* Left Panel: PDF Frame */}
          <div className="flex-1 p-3 h-full overflow-hidden flex flex-col justify-center items-center">
            {previewUrl ? (
              <div 
                className="h-full w-full rounded-2xl overflow-hidden border border-slate-850 bg-[#1E293B] shadow-inner transition-transform duration-200"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
              >
                <iframe
                  src={previewUrl}
                  className="h-full w-full rounded-2xl border-0 bg-white"
                  title={title}
                  allow="autoplay"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <HiOutlineDocumentText className="h-10 w-10 text-slate-700 animate-bounce" />
                <p>No preview link available. You can download the file directly.</p>
              </div>
            )}
          </div>

          {/* Right Panel: Side Tab Console */}
          <div className="w-80 bg-[#111827] border-l border-slate-800 flex flex-col overflow-y-auto shrink-0">
            
            {/* Tabs Controller */}
            <div className="grid grid-cols-2 border-b border-slate-800 bg-[#0B1220] p-1 gap-1">
              <button
                onClick={() => setActiveTab('similar')}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition ${
                  activeTab === 'similar' ? 'bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/10' : 'text-slate-450 hover:text-white'
                }`}
              >
                Similar Items
              </button>
              <button
                onClick={() => {
                  setActiveTab('ai_summary');
                  if (!aiSummary && !aiLoading) handleLoadAISummary();
                }}
                className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1 ${
                  activeTab === 'ai_summary' ? 'bg-[#7C3AED]/15 text-[#7C3AED] border border-[#7C3AED]/10' : 'text-slate-450 hover:text-white'
                }`}
              >
                <HiSparkles className="h-3 w-3 animate-pulse" />
                AI Summary
              </button>
            </div>

            {/* Content Tabs */}
            <div className="p-4 flex-1">
              
              {/* Tab 1: Similar Notes */}
              {activeTab === 'similar' && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <HiOutlineEye className="h-4 w-4 text-[#4F8CFF]" />
                    Related materials
                  </h4>

                  {similarRes?.data && similarRes.data.length > 0 ? (
                    <div className="space-y-3">
                      {similarRes.data.map((item) => (
                        <div 
                          key={item._id}
                          onClick={() => handleSelectSimilar(item)}
                          className="group cursor-pointer rounded-2xl border border-slate-800 bg-[#0B1220]/60 p-3.5 hover:border-[#4F8CFF]/20 hover:bg-[#0B1220] transition duration-200 text-left"
                        >
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${
                            item.category === 'Previous Year Questions' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {item.category || 'Notes'}
                          </span>
                          <h5 className="mt-1 font-bold text-slate-200 text-xs line-clamp-2 group-hover:text-[#4F8CFF] transition">
                            {item.title}
                          </h5>
                          <div className="mt-2.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                            <span>{item.downloads} DLs</span>
                            <span className="inline-flex items-center gap-0.5 text-[#4F8CFF] group-hover:underline">
                              Read
                              <HiOutlineExternalLink className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2 text-slate-500 text-xs">
                      <HiOutlineDocumentText className="h-8 w-8 mx-auto text-slate-700" />
                      <p>No similar documents found.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: AI Summary Panel */}
              {activeTab === 'ai_summary' && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <HiSparkles className="h-4 w-4 text-[#7C3AED]" />
                      Gemini Copilot
                    </h4>
                    <button 
                      onClick={handleLoadAISummary}
                      className="text-[9px] font-black text-[#7C3AED] hover:text-[#4F8CFF] transition"
                    >
                      Re-generate
                    </button>
                  </div>

                  {aiLoading ? (
                    <div className="space-y-3 pt-4">
                      <div className="h-4 bg-slate-800 rounded animate-pulse" />
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6" />
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-4/6" />
                      <div className="h-10 bg-slate-800 rounded animate-pulse" />
                    </div>
                  ) : aiSummary ? (
                    <div className="bg-[#0B1220] border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed font-medium overflow-y-auto max-h-[60vh] space-y-2">
                      {aiSummary.split('\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2 text-slate-500 text-xs">
                      <p>Click load to run Gemini analysis models.</p>
                      <button 
                        onClick={handleLoadAISummary}
                        className="mt-2 text-xs font-bold bg-[#7C3AED] hover:bg-[#7C3AED]/90 px-3 py-1.5 rounded-xl text-white transition shadow"
                      >
                        Start Analysis
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
