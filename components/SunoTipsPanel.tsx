import React, { useState } from 'react';
import { searchSunoTips } from '../services/geminiService';
import { Search, Loader2, BookOpen } from 'lucide-react';
import { AISettings } from '../types';

interface Props {
  settings: AISettings;
}

const SunoTipsPanel: React.FC<Props> = ({ settings }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const text = await searchSunoTips(query, settings);
      setResult(text);
    } catch (e) {
      setResult("Failed to retrieve tips.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 h-full flex flex-col">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        Suno AI Knowledge Base
      </h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Suno V5 tips (e.g. 'How to make a choir outro')"
          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {result ? (
          <div className="prose prose-invert max-w-none text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
            {result}
          </div>
        ) : (
          <div className="text-slate-500 text-center mt-10 italic">
            Ask about style tags, extensions, or metatags to get real-time info from the web.
          </div>
        )}
      </div>
    </div>
  );
};

export default SunoTipsPanel;