import { ExampleLyric } from "./types";

export const ANALYSIS_SYSTEM_INSTRUCTION = `
You are an expert Contemporary Chinese Worship Hymn Producer and Suno AI Prompt Engineer. 
Your goal is to analyze lyrics provided by the user and score them based on professional standards for modern worship music (SOP, ROLCC, Clay Music styles) and Suno AI generation optimization.

You must analyze based on these pillars:
1. **Theology (神学性):** Is the message biblically sound? Does it use "metaphorical" language (Light, River, Rock) to be poetic yet spiritual?
2. **Structure (结构标准):** Does it strictly follow Suno AI V5 structure? (e.g., [Intro], [Verse], [Chorus], [Bridge], [Outro]). Are the tags correct?
3. **Flow (可唱性):** Is the rhythm consistent? Do the lyrics fit a standard 4/4 or 6/8 time signature? Are the rhymes natural?
4. **Imagery (意境美感):** Does it evoke emotion? Avoid dry theological terms; use "Living Water", "Fire", "Home".
5. **Innovation (创意):** Is it unique or too cliché?

Your output must be valid JSON.
`;

export const GENERATION_SYSTEM_INSTRUCTION = `
You are a world-class Chinese Worship Songwriter specializing in Suno AI V5.
Your task is to create a complete song package based on the user's theme.

**CRITICAL RULE:** THE LYRICS **MUST** START WITH "[Intro]". NO EXCEPTIONS.

**Requirements:**
1. **Lyrics:** 
   - **Structure:** START with [Intro]. Then [Verse 1] -> [Pre-Chorus] -> [Chorus] -> [Verse 2] -> [Chorus] -> [Bridge] -> [Chorus] -> [Outro].
   - **Content:** Modern, poetic Chinese worship style. Deep theology but accessible language.
   - **Tags:** Include internal style tags in parentheses (e.g., (Soft piano), (Drums enter)).
2. **Metadata:**
   - **Style Prompts:** A comma-separated string of English tags for Suno (e.g., "Contemporary Worship, Piano, Strings, Male Vocal, 95bpm").
   - **Negative Prompts:** A comma-separated string of things to avoid (e.g., "Rap, Heavy Metal, Distorted, Screaming").
   - **Title:** A creative Chinese title.

Your output must be valid JSON matching the schema.
`;

export const OPTIMIZATION_SYSTEM_INSTRUCTION = `
You are a professional Lyrics Editor. Your goal is to REWRITE the provided lyrics to fix specific issues.
1. You will be given the lyrics and a set of suggestions (or a single suggestion).
2. Apply the changes requested in the suggestions while keeping the rest of the song intact.
3. Ensure the output preserves all Suno tags (e.g. [Verse], [Chorus]).
4. Return ONLY the full rewritten lyrics as a string. No JSON, no conversation.
`;

export const ASSET_GENERATION_SYSTEM_INSTRUCTION = `
You are a Social Media Manager for a Music Label. 
Generate the following assets for a Chinese Worship Song:
1. **Social Caption:** A short, engaging caption for TikTok/Instagram/YouTube Shorts (Chinese). Include emojis and hashtags.
2. **Stylized Title:** A visually aesthetic version of the song title using unicode characters (e.g. ⋆｡°✩ Title ✩°｡⋆ or 〖 Title 〗).

Your output must be valid JSON matching the schema.
`;

export const EXAMPLE_LYRICS: ExampleLyric[] = [
  {
    title: "数算日子 (古风/感叹)",
    style: "Chinese Traditional Instruments, Guzheng, Erhu, Slow, Emotional, 70bpm",
    tags: ["Intro", "Verse", "Chorus", "Bridge"],
    content: `[Intro]
(古筝琶音, 如時光流逝, 笛子吹出悠遠、蒼涼的主旋律, 鋼琴鋪底)

[Verse 1]
(安靜, 充滿感嘆)
祢是我們 世代的居所
從亙古 到永遠 祢都在
群山未曾 生出
大地未曾 造成
祢是那 永恆的所在
(二胡 旋律進入)

[Pre-Chorus]
(情緒平穩, 帶入畫面)
祢使人歸於 塵土
祢說 世人要歸回
千年 在祢看來
不過像 昨日ㄧ更

[Chorus]
(旋律必須優美、簡單、極度易唱)
(輕柔的鈴鼓 進入)
我們度盡的 年歲
好像 那ㄧ聲嘆息
我們ㄧ生的 誇耀
不過是 轉眼成空
(弦樂 輕輕加入)

[Verse 2]
(保持敘事感, 情感更深)
我們好像 清晨發芽
隨風生長 的草
早晨 發芽生長
晚上 枯乾凋零
(二胡 與 弦樂 交織)

[Pre-Chorus]
祢使人歸於 塵土
祢說 世人要歸回
千年 在祢看來
不過像 昨日ㄧ更

[Chorus] (x2)
我們度盡的 年歲
好像 那ㄧ聲嘆息
我們ㄧ生的 誇耀
不過是 轉眼成空

[Bridge]
(抒情的旋律高峰, 全歌的靈魂)
(鋼琴、二胡、弦乐 推动)
求祢指教我 怎樣數算
我餘下的日子
好叫我 得著那
從祢來 的智慧

[Chorus]
我們度盡的 年歲
好像 那ㄧ聲嘆息
我們ㄧ生的 誇耀
不過是 轉眼成空

[Outro]
(安靜 祷告式, 呼应Intro)
求祢指教我 數算
我餘下的 日子
(音樂淡出)`
  },
  {
    title: "生命的江河 (活泼/宣告)",
    style: "Upbeat, Contemporary Worship, Pop Rock, Acoustic Guitar, 95bpm, Bright",
    tags: ["Verse", "Pre-Chorus", "Chorus", "Bridge"],
    content: `[Intro]
(Upbeat acoustic guitar strumming, cheerful whistle melody)

[Verse 1]
心灵深处有一渴望
如同旷野寻找水源
世界一切无法满足
直到遇见生命泉源

[Pre-Chorus]
你说凡喝这水的
还要再渴还要再渴
但喝你所赐水的
永远不渴永远不渴

[Chorus]
我要奔向你
生命的江河
我要饮于你
永恒的泉源

活水江河从你流出
流进我心最深处
干渴的心得满足
生命更新如雨露

[Verse 2]
不再倚靠破裂池子
不再追求短暂满足
你是源头永不枯竭
你是道路真理生命

[Bridge]
让活水涌流
让活水涌流
在这里在现在
让活水涌流

圣灵的江河
圣灵的江河
充满这地方
圣灵的江河

[Chorus] (x2)
活水江河从你流出
(江河涌流)
流进我心最深处
(最深处)
干渴的心得满足
(得满足)
生命更新如雨露
(如雨露)

[Outro]
让江河涌流
让江河涌流
在全地涌流
直到永远`
  },
  {
    title: "磐石之上 (摇滚/信心)",
    style: "Christian Rock, Electric Guitar, Powerful Drums, Male Vocal, Anthem, 110bpm",
    tags: ["Verse", "Chorus", "Bridge"],
    content: `[Intro]
(Electric guitar riff, powerful drum beat)

[Verse 1]
我的心哪，你为何忧闷 
为何在我里面烦躁 
应当仰望神 仰望神
因他笑脸帮助我 

[Verse 2]
我的神啊，我的磐石 
我所投靠的 神呐！
他是我的盾牌 
是拯救我的角 

[Chorus]
磐石之上，我站立 
风雨飘摇，我不惧 
因你同在，我刚强 
哈利路亚，赞美你 

[Verse 3]
耶和华是我的牧者 
我必不至缺罚
他使我躺卧在青草弟 
领我在可安歇的水边 

[Chorus]
磐石之上，我站立 
风雨飘摇，我不惧 
因你同在，我刚强 
哈利路亚，赞美你 

[Bridge]
我的罪，你已赦免 (赦免)
我的病，你已医治 (医治)
我的心，你来安慰 (安慰)
我的灵，你来充满 (充满) 

[Chorus]
磐石之上，我站立 
风雨飘摇，我不惧 
因你同在，我刚强 
哈利路亚，赞美你 

[Outro]
磐石之上
永不动摇`
  }
];

export const TAG_CHEAT_SHEET = [
  { label: "[Intro]", desc: "前奏 (纯音乐/氛围)" },
  { label: "[Verse]", desc: "主歌 (叙事)" },
  { label: "[Pre-Chorus]", desc: "导歌 (情绪过渡)" },
  { label: "[Chorus]", desc: "副歌 (高潮/钩子)" },
  { label: "[Bridge]", desc: "桥段 (突破/升华)" },
  { label: "[Interlude]", desc: "间奏" },
  { label: "[Outro]", desc: "尾声/祷告" },
  { label: "[Instrumental]", desc: "纯乐器演奏" },
  { label: "(x2)", desc: "重复两次" }
];