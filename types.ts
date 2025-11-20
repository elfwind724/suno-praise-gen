export interface LyricAnalysis {
  scores: {
    theology: number; // 神学深度
    structure: number; // 结构完整性 (Suno Tags)
    flow: number; // 可唱性/韵律
    imagery: number; // 意境情感
    innovation: number; // 创意/新鲜感
  };
  overallScore: number;
  feedback: string;
  suggestions: string[];
  sunoTagsCheck: {
    valid: boolean;
    missingTags: string[];
    message: string;
  };
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface ExampleLyric {
  title: string;
  content: string;
  style: string;
  tags: string[];
}

export interface GeneratedSong {
  title: string;
  stylePrompts: string; // e.g. "Cinematic, Orchestral, Male Vocals"
  negativePrompts: string; // e.g. "Rap, Heavy Metal, Distorted"
  lyrics: string;
}

export interface SongAssets {
  coverImage?: string; // Base64 string
  caption?: string;
  stylizedTitle?: string;
}

export enum AppMode {
  EDITOR = 'EDITOR',
  TIPS = 'TIPS',
}

export enum RightPanelTab {
  ANALYSIS = 'ANALYSIS',
  RELEASE_KIT = 'RELEASE_KIT',
}