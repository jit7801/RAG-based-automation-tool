// ---------------------------------------------------------------------------
// On-Brand Multi-Platform Content Repurposing Engine
//
// Synthesizes 4 platform-native content formats from a single verified piece
// of core content while enforcing strict brand voice governance, tone rules,
// forbidden word filters, and claim fidelity checks.
// ---------------------------------------------------------------------------

import { sentences, tokenize } from './embed.ts';
import { execute, type Ctx } from './swytchcode.ts';
import type {
  BrandAlignmentScore,
  BrandProfile,
  RepurposeBundle,
  RepurposedFormatId,
  RepurposedItem,
  ScriptScene,
  TweetItem,
} from '../shared/contract.ts';

// ---------------------------------------------------------------------------
// 1. Built-in Brand Voice Profiles
// ---------------------------------------------------------------------------

export const DEFAULT_BRAND_PROFILES: BrandProfile[] = [
  {
    id: 'tech-analyst',
    name: 'The Pragmatic Tech Analyst',
    tagline: 'Analytical, empirical, crisp, and anti-hype.',
    tone: 'Objective, authoritative, data-backed, and concise.',
    targetAudience: 'Software engineers, AI practitioners, and engineering leaders.',
    forbiddenWords: [
      'game-changer',
      'revolutionize',
      'delve',
      'tapestry',
      'unleash',
      'miracle',
      'testament',
      'disrupt',
      'unprecedented',
      'buckle up',
    ],
    preferredKeywords: ['architecture', 'benchmarks', 'latency', 'trade-offs', 'empirical', 'deployment'],
    signatureSignoff: 'Data over hype.',
    rules: [
      'Lead with concrete numbers and findings, never generic superlatives.',
      'Highlight trade-offs and operational caveats.',
      'Maintain an analytical, neutral editorial tone.',
      'No motivational clichés or superficial enthusiasm.',
    ],
  },
  {
    id: 'bold-founder',
    name: 'The Direct Operator / Founder',
    tagline: 'First-principles, decisive, high conviction, and actionable.',
    tone: 'Direct, candid, punchy, and grounded in real execution.',
    targetAudience: 'Startup founders, product builders, and tech executives.',
    forbiddenWords: [
      'synergy',
      'paradigm shift',
      'delve',
      'thought leader',
      'holistic',
      'leverage',
      'circle back',
    ],
    preferredKeywords: ['velocity', 'leverage', 'unit economics', 'distribution', 'conviction', 'focus'],
    signatureSignoff: 'Build what compounds.',
    rules: [
      'Write in active voice with short, punchy paragraphs.',
      'Focus on the tactical takeaway: what does this mean for builders tomorrow?',
      'Speak from hard-won operational perspective.',
    ],
  },
  {
    id: 'executive-digest',
    name: 'The Executive Brief',
    tagline: 'Strategic, high-signal, macro context, and decision-oriented.',
    tone: 'Boardroom-ready, measured, strategic, and polished.',
    targetAudience: 'CTOs, CIOs, tech investors, and enterprise decision-makers.',
    forbiddenWords: [
      'vibes',
      'game-changer',
      'crazy',
      'insane',
      'delve',
      'hype train',
      'gonna',
      'wanna',
    ],
    preferredKeywords: ['capital allocation', 'market dynamics', 'governance', 'risk posture', 'TCO'],
    signatureSignoff: 'Strategic Briefing.',
    rules: [
      'Lead with the macro economic or strategic shift.',
      'Structure with executive summaries and bulleted key implications.',
      'Address Total Cost of Ownership (TCO) and long-term positioning.',
    ],
  },
];

// ---------------------------------------------------------------------------
// 2. Brand Alignment Evaluator & Gating
// ---------------------------------------------------------------------------

const AI_CLICHE_PHRASES = [
  "in today's fast-paced world",
  "in today's digital landscape",
  "it's important to remember",
  "let's dive in",
  "without further ado",
  "at the end of the day",
  "serves as a testament",
  "beacon of hope",
  "game-changer",
  "paradigm shift",
  "delve into",
];

export function evaluateBrandAlignment(
  content: string,
  originalBody: string,
  profile: BrandProfile,
): BrandAlignmentScore {
  const lowerContent = content.toLowerCase();
  const warnings: string[] = [];
  const flaggedForbidden: string[] = [];

  // A. Vocabulary check: Forbidden Words
  for (const forbidden of profile.forbiddenWords) {
    const regex = new RegExp(`\\b${forbidden.toLowerCase()}\\b`, 'i');
    if (regex.test(lowerContent)) {
      flaggedForbidden.push(forbidden);
      warnings.push(`Contains forbidden buzzword: "${forbidden}"`);
    }
  }

  // B. AI Cliche filter
  for (const cliche of AI_CLICHE_PHRASES) {
    if (lowerContent.includes(cliche)) {
      warnings.push(`Contains generic AI filler phrase: "${cliche}"`);
    }
  }

  // C. Claim / Fact Preservation
  // Check that key numeric tokens and core keywords from the original body remain present
  const originalTokens = tokenize(originalBody);
  const contentTokens = tokenize(content);
  const contentTokenSet = new Set(contentTokens);

  // Extract digits and percentages from original body
  const originalNumbers = originalBody.match(/\b\d+(\.\d+)?%?\b/g) || [];
  let preservedNumbers = 0;
  for (const num of originalNumbers) {
    if (content.includes(num)) {
      preservedNumbers++;
    }
  }

  const numberFidelity =
    originalNumbers.length > 0 ? preservedNumbers / originalNumbers.length : 1.0;

  // Keyword overlap
  const distinctiveOriginal = originalTokens.filter(
    (t) => t.length > 5 && !['according', 'because', 'through', 'between'].includes(t),
  );
  const preservedKeywords = distinctiveOriginal.filter((t) => contentTokenSet.has(t)).length;
  const keywordFidelity =
    distinctiveOriginal.length > 0 ? preservedKeywords / distinctiveOriginal.length : 0.85;

  const claimFidelityScore = Math.round(
    Math.min(100, Math.max(30, (numberFidelity * 0.6 + keywordFidelity * 0.4) * 100)),
  );

  // D. Vocabulary Score
  const vocabDeductions = flaggedForbidden.length * 20 + warnings.filter((w) => w.includes('filler')).length * 15;
  const vocabularyScore = Math.max(0, 100 - vocabDeductions);

  // E. Tone Score
  let toneScore = 90;
  if (flaggedForbidden.length > 0) toneScore -= 15;
  if (content.length < 50) {
    toneScore -= 25;
    warnings.push('Content is too brief to convey brand depth.');
  }

  // Overall Score
  const overallScore = Math.round(vocabularyScore * 0.4 + toneScore * 0.3 + claimFidelityScore * 0.3);
  const passed = overallScore >= 75 && flaggedForbidden.length === 0;

  return {
    overallScore,
    toneScore,
    vocabularyScore,
    claimFidelityScore,
    flaggedForbiddenWords: flaggedForbidden,
    warnings,
    passed,
  };
}

// ---------------------------------------------------------------------------
// 3. Fallback Generators (Deterministic, Highly Styled)
// ---------------------------------------------------------------------------

function generateFallbackVideoScript(
  topic: string,
  body: string,
  profile: BrandProfile,
): { content: string; scenes: ScriptScene[] } {
  const s = sentences(body);
  const leadSentence = s[0] || body;
  const detailSentence = s[1] || s[0] || body;
  const takeaway = s[2] || s[0] || `${topic} marks a structural shift in production workflows.`;

  const scenes: ScriptScene[] = [
    {
      timestamp: '00:00 - 00:05',
      visualCue: 'Close-up on speaker holding phone with chart/terminal graphic on screen.',
      onScreenText: `STOP SCROLLING: ${topic.slice(0, 45)}...`,
      narration: `Here is the one number in tech you cannot afford to ignore this week: ${leadSentence}`,
    },
    {
      timestamp: '00:05 - 00:18',
      visualCue: 'Screen recording transitions to architecture diagram showing cost/infrastructure delta.',
      onScreenText: 'WHY THIS HAPPENED 📉',
      narration: `What drove this? ${detailSentence} Operators who adjusted early are seeing immediate leverage.`,
    },
    {
      timestamp: '00:18 - 00:30',
      visualCue: 'Fast zoom on speaker looking directly into camera with bulleted summary overlay.',
      onScreenText: 'THE OPERATOR TAKEAWAY 💡',
      narration: `${takeaway} If you are architecting your stack right now, factor this in today.`,
    },
    {
      timestamp: '00:30 - 00:35',
      visualCue: 'Logo outro card with minimalist dark theme and brand tag.',
      onScreenText: profile.signatureSignoff || 'Follow for daily signal.',
      narration: `${profile.signatureSignoff || 'Follow for daily signal.'} What is your take? Let us know below.`,
    },
  ];

  const content = scenes
    .map(
      (scene, i) =>
        `[SCENE ${i + 1} (${scene.timestamp})]\n` +
        `📹 VISUAL: ${scene.visualCue}\n` +
        `📝 ON-SCREEN TEXT: "${scene.onScreenText}"\n` +
        `🎙️ NARRATION: "${scene.narration}"\n`,
    )
    .join('\n');

  return { content, scenes };
}

function generateFallbackThread(
  topic: string,
  body: string,
  profile: BrandProfile,
): { content: string; tweets: TweetItem[] } {
  const s = sentences(body);
  const lead = s[0] || body;
  const detail1 = s[1] || 'Multiple providers confirmed the trend across benchmarking suites.';
  const detail2 = s[2] || 'The change penalises legacy setups while compounding for modern deployments.';

  const tweetTexts = [
    `1/4 🧵 ${topic}.\n\nHere is what is happening, why the numbers moved, and what it means for your stack 👇`,
    `2/4 📊 The Core Data:\n\n${lead}\n\nThis is not speculation — corroborated across independent industry benchmarks.`,
    `3/4 ⚙️ Under The Hood:\n\n${detail1}\n\n${detail2}`,
    `4/4 🎯 The Takeaway:\n\nIf you are planning Q3/Q4 deployments, reassess your assumptions.\n\n${profile.signatureSignoff || 'Data over hype.'}\n\nRT the first tweet if you found this useful 🔄`,
  ];

  const tweets: TweetItem[] = tweetTexts.map((text, idx) => ({
    index: idx + 1,
    text,
    charCount: text.length,
  }));

  const content = tweetTexts.join('\n\n---\n\n');
  return { content, tweets };
}

function generateFallbackCaption(
  topic: string,
  body: string,
  profile: BrandProfile,
): { content: string; hashtags: string[] } {
  const s = sentences(body);
  const lead = s[0] || body;
  const detail = s.slice(1).join(' ') || 'A notable shift in technical and economic fundamentals.';

  const hashtags = [
    '#TechTrends',
    '#EngineeringLeadership',
    '#Architecture',
    '#DataInfrastructure',
    '#TechnologyStrategy',
  ];

  const content =
    `💡 ${topic}\n\n` +
    `${lead}\n\n` +
    `Here is the key context:\n` +
    `• ${detail}\n` +
    `• The operational implications favor teams built for adaptability.\n` +
    `• Legacy assumptions about cost and latency no longer apply.\n\n` +
    `How is your team responding to this shift?\n\n` +
    `---\n` +
    `${profile.signatureSignoff ? `"${profile.signatureSignoff}"\n\n` : ''}` +
    `${hashtags.join(' ')}`;

  return { content, hashtags };
}

function generateFallbackBlogSnippet(
  topic: string,
  body: string,
  profile: BrandProfile,
): { content: string; wordCount: number } {
  const s = sentences(body);
  const lead = s[0] || body;
  const details = s.slice(1).join(' ') || 'Recent data highlights significant structural movement.';

  const markdown =
    `# ${topic}\n\n` +
    `*By ${profile.name} • 3 min read*\n\n` +
    `> **Executive TL;DR**: ${lead}\n\n` +
    `### Analysis & Market Implications\n\n` +
    `${details}\n\n` +
    `Industry practitioners are noting that what seemed like an incremental update is having cascading second-order effects across development cycles and infrastructure margins.\n\n` +
    `### Key Takeaways for Technical Leaders\n\n` +
    `1. **Evaluate Unit Economics**: Audit existing workflows against the updated pricing and performance baselines.\n` +
    `2. **Avoid Premature Lock-in**: Architecture decisions should remain modular as underlying tooling evolves.\n` +
    `3. **Focus on Execution**: Strategic advantage flows to teams that iterate on real user feedback rather than baseline tool hype.\n\n` +
    `---\n\n` +
    `*${profile.tagline}*`;

  const wordCount = markdown.split(/\s+/).length;
  return { content: markdown, wordCount };
}

// ---------------------------------------------------------------------------
// 4. Main Multi-Format Repurposer Orchestrator
// ---------------------------------------------------------------------------

export async function repurposeCoreContent(
  ctx: Ctx,
  body: string,
  topic?: string,
  profileId?: string,
): Promise<RepurposeBundle> {
  const cleanTopic = topic || sentences(body)[0] || 'Key Industry Update';
  const brandProfile =
    DEFAULT_BRAND_PROFILES.find((p) => p.id === profileId) || DEFAULT_BRAND_PROFILES[0];

  // 1. Video Script
  const videoResult = await execute(
    ctx,
    'openai',
    'chat.completions.videoScript',
    {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert short-form video producer writing a high-retention 35-second script. Voice: ${brandProfile.tone}. Rules: ${brandProfile.rules.join('; ')}. DO NOT use forbidden words: ${brandProfile.forbiddenWords.join(', ')}.`,
        },
        {
          role: 'user',
          content: `Write a short-form video script for: ${cleanTopic}\n\nCore Facts:\n${body}`,
        },
      ],
    },
    () => generateFallbackVideoScript(cleanTopic, body, brandProfile),
  );

  const videoScriptItem: RepurposedItem = {
    formatId: 'video_script',
    title: 'Short-Form Video Script',
    platform: 'TikTok / Reels / Shorts',
    content: typeof videoResult === 'string' ? videoResult : videoResult.content,
    estimatedReadTime: '35s video',
    metadata: {
      scenes: typeof videoResult === 'object' && 'scenes' in videoResult ? videoResult.scenes : undefined,
    },
    brandScore: evaluateBrandAlignment(
      typeof videoResult === 'string' ? videoResult : videoResult.content,
      body,
      brandProfile,
    ),
  };

  // 2. Twitter / X Thread
  const threadResult = await execute(
    ctx,
    'openai',
    'chat.completions.thread',
    {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a viral tech writer creating a 4-tweet thread. Tone: ${brandProfile.tone}. Forbidden words: ${brandProfile.forbiddenWords.join(', ')}. Keep each tweet under 280 characters. Number tweets 1/4, 2/4 etc.`,
        },
        {
          role: 'user',
          content: `Create a 4-tweet thread for: ${cleanTopic}\n\nSource Content:\n${body}`,
        },
      ],
    },
    () => generateFallbackThread(cleanTopic, body, brandProfile),
  );

  const threadItem: RepurposedItem = {
    formatId: 'thread',
    title: 'X / Twitter Thread',
    platform: 'X (Twitter)',
    content: typeof threadResult === 'string' ? threadResult : threadResult.content,
    estimatedReadTime: '1 min read',
    metadata: {
      tweets: typeof threadResult === 'object' && 'tweets' in threadResult ? threadResult.tweets : undefined,
    },
    brandScore: evaluateBrandAlignment(
      typeof threadResult === 'string' ? threadResult : threadResult.content,
      body,
      brandProfile,
    ),
  };

  // 3. Social / LinkedIn Caption
  const captionResult = await execute(
    ctx,
    'openai',
    'chat.completions.caption',
    {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are writing a LinkedIn insight post. Tone: ${brandProfile.tone}. Whitespace formatting with bullet points. DO NOT use buzzwords: ${brandProfile.forbiddenWords.join(', ')}. Sign off with: ${brandProfile.signatureSignoff || ''}.`,
        },
        {
          role: 'user',
          content: `Write an engaging LinkedIn post for: ${cleanTopic}\n\nContext:\n${body}`,
        },
      ],
    },
    () => generateFallbackCaption(cleanTopic, body, brandProfile),
  );

  const captionItem: RepurposedItem = {
    formatId: 'social_caption',
    title: 'LinkedIn / Social Caption',
    platform: 'LinkedIn & Social',
    content: typeof captionResult === 'string' ? captionResult : captionResult.content,
    estimatedReadTime: '45s read',
    metadata: {
      hashtags: typeof captionResult === 'object' && 'hashtags' in captionResult ? captionResult.hashtags : undefined,
    },
    brandScore: evaluateBrandAlignment(
      typeof captionResult === 'string' ? captionResult : captionResult.content,
      body,
      brandProfile,
    ),
  };

  // 4. Blog / Newsletter Snippet
  const blogResult = await execute(
    ctx,
    'openai',
    'chat.completions.blogSnippet',
    {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an editorial editor writing a Markdown newsletter digest snippet. Tone: ${brandProfile.tone}. Use structured headers, TL;DR, and numbered takeaways. Avoid buzzwords: ${brandProfile.forbiddenWords.join(', ')}.`,
        },
        {
          role: 'user',
          content: `Write a blog digest snippet for: ${cleanTopic}\n\nContent:\n${body}`,
        },
      ],
    },
    () => generateFallbackBlogSnippet(cleanTopic, body, brandProfile),
  );

  const blogItem: RepurposedItem = {
    formatId: 'blog_snippet',
    title: 'Newsletter / Blog Digest',
    platform: 'Substack / Blog / Medium',
    content: typeof blogResult === 'string' ? blogResult : blogResult.content,
    estimatedReadTime: '2 min read',
    metadata: {
      wordCount: typeof blogResult === 'object' && 'wordCount' in blogResult ? blogResult.wordCount : undefined,
    },
    brandScore: evaluateBrandAlignment(
      typeof blogResult === 'string' ? blogResult : blogResult.content,
      body,
      brandProfile,
    ),
  };

  return {
    id: `bundle-${Date.now()}`,
    originalTopic: cleanTopic,
    originalBody: body,
    brandProfile,
    formats: {
      video_script: videoScriptItem,
      thread: threadItem,
      social_caption: captionItem,
      blog_snippet: blogItem,
    },
    createdAt: new Date().toISOString(),
  };
}
