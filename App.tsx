import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Sparkles, 
  PlayCircle, 
  Copy, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  LayoutTemplate,
  BarChart3,
  ListChecks,
  Wand2,
  Settings2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Share2,
  Type,
  Download,
  Settings,
  KeyRound
} from 'lucide-react';
import { analyzeLyrics, generateLyrics, optimizeLyrics, generateSongAssets, generateCoverImage } from './services/geminiService';
import RadarChartScore from './components/RadarChartScore';
import SunoTipsPanel from './components/SunoTipsPanel';
import { EXAMPLE_LYRICS, TAG_CHEAT_SHEET } from './constants';
import { LyricAnalysis, AppMode, RightPanelTab, SongAssets, AISettings, AIProvider } from './types';

const App: React.FC = () => {
  const [lyrics, setLyrics] = useState<string>("");
  const [title, setTitle] = useState("");
  const [stylePrompts, setStylePrompts] = useState("");
  const [negativePrompts, setNegativePrompts] = useState("Rap, Heavy Metal, Distorted, Screaming, Mumbled");
  
  // Technical Settings
  const [weirdness, setWeirdness] = useState<number>(50); // 0-100 scale for UI (mapped to float)
  const [styleInfluence, setStyleInfluence] = useState<number>(50); // 0-100 scale
  const [vocalGender, setVocalGender] = useState<'Male'|'Female'|'Both'>('Both');

  const [analysis, setAnalysis] = useState<LyricAnalysis | null>(null);
  const [songAssets, setSongAssets] = useState<SongAssets | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const [genPrompt, setGenPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<AppMode>(AppMode.EDITOR);
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>(RightPanelTab.ANALYSIS);
  
  const [showExamples, setShowExamples] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [applyingSuggestionIndex, setApplyingSuggestionIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // API Settings
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: AIProvider.GEMINI,
    geminiKey: process.env.API_KEY || "",
    zhipuKey: ""
  });

  useEffect(() => {
    if (!lyrics) {
      setLyrics(`[Intro]
(Piano and soft strings, atmospheric)

[Verse 1]
在这里写下你的歌词...
(Write your lyrics here...)

[Chorus]
...`);
    }
    // Load settings from local storage if needed, or just keep default
    const storedZhipu = localStorage.getItem('zhipu_key');
    const storedGemini = localStorage.getItem('gemini_key');
    const storedProvider = localStorage.getItem('ai_provider');
    
    if(storedZhipu || storedGemini || storedProvider) {
        setAiSettings(prev => ({
            ...prev,
            zhipuKey: storedZhipu || prev.zhipuKey,
            geminiKey: storedGemini || prev.geminiKey,
            provider: (storedProvider as AIProvider) || prev.provider
        }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSettings = () => {
      localStorage.setItem('zhipu_key', aiSettings.zhipuKey);
      localStorage.setItem('gemini_key', aiSettings.geminiKey);
      localStorage.setItem('ai_provider', aiSettings.provider);
      setShowSettings(false);
  }

  const handleAnalyze = async () => {
    if (!lyrics.trim()) return;
    setIsAnalyzing(true);
    setRightPanelTab(RightPanelTab.ANALYSIS);
    try {
      const result = await analyzeLyrics(lyrics, aiSettings);
      setAnalysis(result);
      setActiveTab(AppMode.EDITOR); 
    } catch (error) {
      alert(`Analysis failed. Please check your ${aiSettings.provider} API configuration.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateLyrics(genPrompt, "Modern Worship", aiSettings);
      setLyrics(result.lyrics);
      setTitle(result.title);
      setStylePrompts(result.stylePrompts);
      if(result.negativePrompts) setNegativePrompts(result.negativePrompts);
      
      // Update technical settings if AI suggested them
      if(result.suggestedSettings) {
          setWeirdness(result.suggestedSettings.weirdness * 10); // Scale 1-10 to 0-100
          setStyleInfluence(result.suggestedSettings.styleInfluence * 10);
          if(result.suggestedSettings.vocalGender) setVocalGender(result.suggestedSettings.vocalGender as any);
      }

      // Auto-analyze generated lyrics
      const analysisResult = await analyzeLyrics(result.lyrics, aiSettings);
      setAnalysis(analysisResult);
      setRightPanelTab(RightPanelTab.ANALYSIS);
    } catch (error) {
      alert("Generation failed. Check API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGlobalOptimize = async () => {
    if(!analysis || !lyrics) return;
    setIsOptimizing(true);
    try {
        const optimizedLyrics = await optimizeLyrics(lyrics, analysis.suggestions, aiSettings);
        setLyrics(optimizedLyrics);
        const newAnalysis = await analyzeLyrics(optimizedLyrics, aiSettings);
        setAnalysis(newAnalysis);
    } catch (error) {
        alert("Optimization failed.");
    } finally {
        setIsOptimizing(false);
    }
  };

  const handleApplySingleSuggestion = async (suggestion: string, index: number) => {
      if(!lyrics) return;
      setApplyingSuggestionIndex(index);
      try {
          const optimizedLyrics = await optimizeLyrics(lyrics, [suggestion], aiSettings);
          setLyrics(optimizedLyrics);
      } catch (error) {
          alert("Failed to apply suggestion.");
      } finally {
          setApplyingSuggestionIndex(null);
      }
  }

  const handleGenerateAssets = async () => {
      if(!title) return;
      setIsGeneratingAssets(true);
      try {
          const assets = await generateSongAssets(title, lyrics, stylePrompts, aiSettings);
          setSongAssets(prev => ({ ...prev, ...assets }));
      } catch (error) {
          alert("Failed to generate text assets");
      } finally {
          setIsGeneratingAssets(false);
      }
  }

  const handleGenerateCover = async () => {
      if(!lyrics) return;
      setIsGeneratingImage(true);
      try {
          const base64Img = await generateCoverImage(title || "Worship Song", lyrics, aiSettings);
          setSongAssets(prev => ({ ...prev, coverImage: base64Img }));
      } catch (error: any) {
          alert(error.message || "Failed to generate cover image");
      } finally {
          setIsGeneratingImage(false);
      }
  }

  const insertTag = (tag: string) => {
    setLyrics(prev => prev + `\n\n${tag}\n`);
  };

  const loadExample = (ex: typeof EXAMPLE_LYRICS[0]) => {
      setLyrics(ex.content);
      setTitle(ex.title);
      setStylePrompts(ex.style);
      setShowExamples(false);
  };

  const chartData = analysis ? [
    { subject: '神学性', A: analysis.scores.theology, fullMark: 100 },
    { subject: '结构(Suno)', A: analysis.scores.structure, fullMark: 100 },
    { subject: '可唱性', A: analysis.scores.flow, fullMark: 100 },
    { subject: '意境', A: analysis.scores.imagery, fullMark: 100 },
    { subject: '创意', A: analysis.scores.innovation, fullMark: 100 },
  ] : [];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 75) return "text-indigo-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <Settings className="w-5 h-5 text-indigo-500"/>
                          API Configuration
                      </h3>
                      <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <div className="p-6 space-y-6">
                      
                      {/* Provider Selection */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-950 p-1 rounded-lg border border-slate-800">
                          <button 
                            onClick={() => setAiSettings(s => ({...s, provider: AIProvider.GEMINI}))}
                            className={`py-2 px-4 rounded-md text-sm font-bold transition-all ${aiSettings.provider === AIProvider.GEMINI ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                              Google Gemini
                          </button>
                          <button 
                            onClick={() => setAiSettings(s => ({...s, provider: AIProvider.ZHIPU}))}
                            className={`py-2 px-4 rounded-md text-sm font-bold transition-all ${aiSettings.provider === AIProvider.ZHIPU ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                              Zhipu GLM-4.6
                          </button>
                      </div>

                      <div className="space-y-4">
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                  Google Gemini Key
                                  {aiSettings.geminiKey && <CheckCircle2 className="w-3 h-3 text-emerald-500"/>}
                              </label>
                              <div className="relative">
                                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                                  <input 
                                    type="password"
                                    value={aiSettings.geminiKey}
                                    onChange={(e) => setAiSettings(s => ({...s, geminiKey: e.target.value}))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="AIzaSy..."
                                  />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                  Zhipu AI Key (GLM-4.6)
                                  {aiSettings.zhipuKey && <CheckCircle2 className="w-3 h-3 text-emerald-500"/>}
                              </label>
                              <div className="relative">
                                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"/>
                                  <input 
                                    type="password"
                                    value={aiSettings.zhipuKey}
                                    onChange={(e) => setAiSettings(s => ({...s, zhipuKey: e.target.value}))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Enter Zhipu Key..."
                                  />
                              </div>
                              <p className="text-[10px] text-slate-500">
                                  Required for GLM-4.6 mode. Note: Image generation still uses Gemini.
                              </p>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
                      <button 
                        onClick={saveSettings}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-indigo-900/20"
                      >
                          Save Configuration
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-900/20">
              <Music className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">Suno Praise Gen</h1>
              <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400 font-medium">AI Worship Workshop</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-400 font-mono">
                      {aiSettings.provider === AIProvider.GEMINI ? 'GEMINI 2.5' : 'GLM-4.6'}
                  </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 hidden md:flex">
                <button 
                onClick={() => setActiveTab(AppMode.EDITOR)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === AppMode.EDITOR ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                Lyric Studio
                </button>
                <button 
                onClick={() => setActiveTab(AppMode.TIPS)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === AppMode.TIPS ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                Knowledge Base
                </button>
            </div>
            
            <button 
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700/50"
                title="API Settings"
            >
                <Settings className="w-5 h-5"/>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {activeTab === AppMode.TIPS ? (
            <div className="lg:col-span-12 h-[85vh]">
                <SunoTipsPanel settings={aiSettings} />
            </div>
        ) : (
        <>
        {/* Left Column: Editor & Generation */}
        <div className="lg:col-span-7 flex flex-col gap-5 h-full">
          
          {/* Generator Input */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-1">
             <div className="flex gap-2 p-2">
                <div className="relative flex-1">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                    <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                        placeholder="Describe your song (e.g. 'Epic worship about the Red Sea, cinematic, 4/4')"
                        value={genPrompt}
                        onChange={(e) => setGenPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                </div>
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/20 flex items-center gap-2 disabled:opacity-50 whitespace-nowrap transition-all active:scale-95"
                >
                    {isGenerating ? <RefreshCw className="animate-spin w-4 h-4"/> : "Generate"}
                </button>
             </div>
          </div>

          {/* Metadata Section (Suno UI Mimic) */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col gap-4 shadow-sm">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Title</label>
                    <input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Song Title"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>
            
            <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Style of Music</label>
                 <textarea 
                    value={stylePrompts}
                    onChange={(e) => setStylePrompts(e.target.value)}
                    placeholder="e.g. Acoustic Pop, Piano, Male Vocals, Slow, 85bpm"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none h-16 resize-none"
                 />
            </div>

            {/* Advanced Options Accordion */}
            <div className="border-t border-slate-800 pt-2">
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors w-full py-1"
                >
                    {showAdvanced ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                    Advanced Options
                </button>
                
                {showAdvanced && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 space-y-4">
                         
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Exclude Styles (Negative Prompts)</label>
                            <input 
                                value={negativePrompts}
                                onChange={(e) => setNegativePrompts(e.target.value)}
                                placeholder="e.g. Rap, Metal, Distorted"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm focus:border-indigo-500 outline-none"
                            />
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                 <div className="flex justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Vocal Gender</label>
                                 </div>
                                 <div className="flex bg-slate-950 rounded-lg border border-slate-700 p-1">
                                     {['Male', 'Female', 'Both'].map((gender) => (
                                         <button 
                                            key={gender}
                                            onClick={() => setVocalGender(gender as any)}
                                            className={`flex-1 text-xs py-1.5 rounded ${vocalGender === gender ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                         >
                                             {gender}
                                         </button>
                                     ))}
                                 </div>
                             </div>

                             <div>
                                 <div className="flex justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Weirdness</label>
                                    <span className="text-xs font-mono text-indigo-400">{Math.round(weirdness / 10)}</span>
                                 </div>
                                 <input 
                                    type="range" min="10" max="100" step="10"
                                    value={weirdness} onChange={(e) => setWeirdness(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                 />
                             </div>

                             <div>
                                 <div className="flex justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Style Influence</label>
                                    <span className="text-xs font-mono text-indigo-400">{Math.round(styleInfluence / 10)}</span>
                                 </div>
                                 <input 
                                    type="range" min="10" max="100" step="10"
                                    value={styleInfluence} onChange={(e) => setStyleInfluence(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                 />
                             </div>
                         </div>
                    </div>
                )}
            </div>
          </div>

          {/* Lyric Editor */}
          <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col overflow-hidden relative group min-h-[400px]">
            
            {/* Toolbar */}
            <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between overflow-x-auto no-scrollbar">
               <div className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Structure:</span>
                  {TAG_CHEAT_SHEET.slice(0, 4).map(tag => (
                      <button 
                        key={tag.label}
                        onClick={() => insertTag(tag.label)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 hover:text-indigo-300 text-slate-400 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
                      >
                        {tag.label}
                      </button>
                  ))}
                  <button 
                    onClick={() => setShowExamples(!showExamples)}
                    className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 transition-colors ml-2 flex items-center gap-1"
                  >
                    <LayoutTemplate className="w-3 h-3"/> Templates
                  </button>
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => navigator.clipboard.writeText(lyrics)}
                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all" 
                    title="Copy Lyrics"
                  >
                      <Copy className="w-4 h-4"/>
                  </button>
               </div>
            </div>

            {/* Example Modal Overlay */}
            {showExamples && (
                <div className="absolute top-14 left-4 right-4 bg-slate-800/95 backdrop-blur border border-slate-600 rounded-xl shadow-2xl z-20 p-5 grid grid-cols-1 gap-3 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-2">
                         <h4 className="text-sm font-bold text-white">Select a Template</h4>
                         <button onClick={() => setShowExamples(false)} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    {EXAMPLE_LYRICS.map((ex, idx) => (
                        <div key={idx} className="p-3 bg-slate-900/80 rounded-lg cursor-pointer hover:border-indigo-500 border border-transparent group transition-all"
                             onClick={() => loadExample(ex)}>
                            <h4 className="font-bold text-indigo-400 text-sm group-hover:text-indigo-300">{ex.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 truncate">{ex.content.substring(0, 50)}...</p>
                        </div>
                    ))}
                </div>
            )}

            <textarea 
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="flex-1 w-full bg-transparent p-6 outline-none font-mono text-sm md:text-base leading-relaxed resize-none text-slate-300 placeholder:text-slate-700 custom-scrollbar"
                spellCheck={false}
                placeholder="Start writing your worship song here..."
            />
            
            {/* Action Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 font-mono">
                        {lyrics.length} chars
                    </span>
                    {analysis && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${analysis.sunoTagsCheck.valid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {analysis.sunoTagsCheck.valid ? "Tags Valid" : "Tags Issue"}
                        </span>
                    )}
                </div>
                <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !lyrics}
                    className="group relative inline-flex items-center justify-center px-6 py-2.5 font-bold text-white transition-all duration-200 bg-indigo-600 rounded-xl hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAnalyzing ? (
                        <span className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin"/> Analyzing...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <PlayCircle className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"/> Analyze Score
                        </span>
                    )}
                </button>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Results & Release Kit */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
           
           {/* Right Panel Tabs */}
           <div className="flex mb-4 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button 
                    onClick={() => setRightPanelTab(RightPanelTab.ANALYSIS)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${rightPanelTab === RightPanelTab.ANALYSIS ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <BarChart3 className="w-4 h-4"/> Analysis
                </button>
                <button 
                    onClick={() => setRightPanelTab(RightPanelTab.RELEASE_KIT)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${rightPanelTab === RightPanelTab.RELEASE_KIT ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Sparkles className="w-4 h-4"/> Release Kit
                </button>
           </div>

           {/* Tab Content: Analysis */}
           {rightPanelTab === RightPanelTab.ANALYSIS && (
               !analysis && !isAnalyzing ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                    <BarChart3 className="w-16 h-16 mb-4 opacity-20 text-indigo-400"/>
                    <h3 className="text-lg font-bold text-slate-500 mb-2">No Analysis Yet</h3>
                    <p className="text-sm text-center max-w-xs">Generate lyrics or write your own, then click "Analyze Score" to get professional feedback.</p>
                 </div>
               ) : isAnalyzing ? (
                 <div className="h-full flex flex-col gap-4 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse">
                    <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-64 bg-slate-800 rounded-xl w-full"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-full"></div>
                        <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                    </div>
                 </div>
               ) : analysis ? (
                 <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pb-20 pr-2 animate-in slide-in-from-right duration-500 fade-in space-y-5">
                    {/* Score Card */}
                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                            <Sparkles className="w-48 h-48 text-indigo-500"/>
                        </div>
                        
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500"/>
                                    Analysis Report
                                </h2>
                                <p className="text-slate-400 text-xs mt-1">AI Professional Review</p>
                            </div>
                            <div className="flex flex-col items-end">
                                 <div className={`text-5xl font-black tracking-tighter ${getScoreColor(analysis.overallScore)}`}>
                                    {analysis.overallScore}
                                 </div>
                                 <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Overall Score</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                            <div className="h-40 relative flex items-center justify-center">
                                <RadarChartScore data={chartData} />
                            </div>
                            <div className="flex flex-col justify-center space-y-3">
                                {chartData.map(item => (
                                    <div key={item.subject} className="group">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-slate-400 font-medium group-hover:text-white transition-colors">{item.subject}</span>
                                            <span className={`font-bold ${getScoreColor(item.A)}`}>{item.A}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${item.A >= 80 ? 'bg-emerald-500' : item.A >= 60 ? 'bg-indigo-500' : 'bg-rose-500'}`} 
                                                style={{width: `${item.A}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                            <h3 className="text-indigo-300 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Sparkles className="w-3 h-3"/> Critique
                            </h3>
                            <p className="text-sm text-slate-300 leading-relaxed text-justify">
                                {analysis.feedback}
                            </p>
                        </div>
                    </div>

                    {/* Detailed Breakdown & Suggestions */}
                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
                         <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-emerald-400"/> 
                                Optimization Steps
                            </h3>
                            {!analysis.sunoTagsCheck.valid && (
                                <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-1 rounded border border-rose-500/30 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3"/> Structure Errors
                                </span>
                            )}
                         </div>

                         <div className="space-y-2.5">
                            {analysis.suggestions.map((s, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 hover:border-indigo-500/30 transition-all group">
                                    <span className="bg-slate-700 text-slate-300 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        {i+1}
                                    </span>
                                    <span className="text-sm text-slate-300 group-hover:text-slate-200 flex-1">{s}</span>
                                    <button 
                                        onClick={() => handleApplySingleSuggestion(s, i)}
                                        disabled={applyingSuggestionIndex !== null}
                                        className="p-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-md transition-colors text-xs font-bold whitespace-nowrap"
                                        title="Apply this fix automatically"
                                    >
                                        {applyingSuggestionIndex === i ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : "Apply Fix"}
                                    </button>
                                </div>
                            ))}
                         </div>

                         {/* Optimization Action */}
                         <div className="mt-6 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-xl p-1 border border-indigo-500/30">
                           <button 
                              onClick={handleGlobalOptimize}
                              disabled={isOptimizing}
                              className="w-full bg-slate-900/80 hover:bg-slate-800 text-indigo-300 hover:text-white p-3 rounded-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                           >
                               {isOptimizing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>}
                               <span className="font-bold text-sm">Apply All Improvements</span>
                           </button>
                        </div>

                         {!analysis.sunoTagsCheck.valid && (
                             <div className="mt-5 p-4 bg-rose-900/10 border border-rose-800/30 rounded-xl">
                                 <h4 className="text-rose-400 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3"/>
                                    Suno Structure Issues
                                 </h4>
                                 <p className="text-xs text-rose-200/80 mb-3 leading-relaxed">{analysis.sunoTagsCheck.message}</p>
                                 {analysis.sunoTagsCheck.missingTags.length > 0 && (
                                     <div className="flex gap-1.5 flex-wrap">
                                         {analysis.sunoTagsCheck.missingTags.map(t => (
                                             <span key={t} className="text-[10px] bg-rose-950 text-rose-400 px-2 py-1 rounded border border-rose-900/50">
                                                 Missing: {t}
                                             </span>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         )}
                    </div>
                 </div>
               ) : null
           )}

           {/* Tab Content: Release Kit */}
           {rightPanelTab === RightPanelTab.RELEASE_KIT && (
               <div className="h-full overflow-y-auto custom-scrollbar pb-20 pr-2 animate-in slide-in-from-right duration-500 fade-in space-y-5">
                   
                   <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-pink-400"/> Viral Cover Art
                            </h3>
                            <button 
                                onClick={handleGenerateCover}
                                disabled={isGeneratingImage || !lyrics}
                                className="text-xs bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                {isGeneratingImage ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                Generate Art
                            </button>
                        </div>
                        <div className="aspect-square bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative group">
                            {songAssets?.coverImage ? (
                                <>
                                <img src={`data:image/png;base64,${songAssets.coverImage}`} alt="Cover Art" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                     <a 
                                        href={`data:image/png;base64,${songAssets.coverImage}`} 
                                        download="cover-art.png"
                                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full backdrop-blur-sm"
                                     >
                                         <Download className="w-6 h-6"/>
                                     </a>
                                </div>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    <ImageIcon className="w-12 h-12 text-slate-700 mx-auto mb-2"/>
                                    <p className="text-xs text-slate-500">Generate AI cover art based on your lyrics</p>
                                    {aiSettings.provider === AIProvider.ZHIPU && !aiSettings.geminiKey && (
                                        <p className="text-[10px] text-rose-400 mt-2">Gemini Key required for Images</p>
                                    )}
                                </div>
                            )}
                        </div>
                   </div>

                   <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                <Type className="w-4 h-4 text-sky-400"/> Song Assets
                            </h3>
                            <button 
                                onClick={handleGenerateAssets}
                                disabled={isGeneratingAssets || !title}
                                className="text-xs bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                {isGeneratingAssets ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                Generate Text
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Stylized Title</label>
                                <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white font-medium flex justify-between items-center">
                                    {songAssets?.stylizedTitle || <span className="text-slate-600 italic">No stylized title yet...</span>}
                                    {songAssets?.stylizedTitle && (
                                        <button onClick={() => navigator.clipboard.writeText(songAssets.stylizedTitle!)} className="text-slate-500 hover:text-white">
                                            <Copy className="w-3.5 h-3.5"/>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Viral Caption</label>
                                <div className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 min-h-[80px] whitespace-pre-wrap relative">
                                    {songAssets?.caption || <span className="text-slate-600 italic">No caption generated yet...</span>}
                                    {songAssets?.caption && (
                                        <button onClick={() => navigator.clipboard.writeText(songAssets.caption!)} className="absolute top-2 right-2 text-slate-500 hover:text-white">
                                            <Copy className="w-3.5 h-3.5"/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                   </div>
               </div>
           )}

        </div>
        </>
        )}
      </main>
    </div>
  );
};

export default App;