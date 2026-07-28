/**
 * Phase 2 vocabulary glossary.
 * Hardcoded 8–12 key terms drawn from the readings, each with a Chinese
 * definition and an English gloss. Stored here so the Reader toolbar can
 * surface a quick-reference panel without a backend.
 *
 * Notes on shape:
 *   - `term` is the canonical Chinese entry (also used for substring match).
 *   - `en` is the English gloss shown in the UI.
 *   - `definition` is a short Chinese definition (paraphrased, not a quote).
 *   - `aliases` (optional) are alternate Chinese spellings the user might type
 *     (e.g. 半截 vs. 整个). The Reader panel matches against term + aliases.
 */
export interface GlossaryEntry {
  term: string;
  en: string;
  definition: string;
  aliases?: string[];
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: '实践',
    en: 'practice',
    definition: '人类有目的改造客观世界的物质活动,是一切认识的来源和检验标准。',
    aliases: ['实践论'],
  },
  {
    term: '矛盾',
    en: 'contradiction',
    definition: '事物内部或事物之间对立统一的相互关系;推动事物发展的根本动力。',
    aliases: ['矛盾论'],
  },
  {
    term: '矛盾普遍性',
    en: 'universality of contradiction',
    definition: '矛盾存在于一切事物发展的过程中,贯穿于每一过程的始终。',
  },
  {
    term: '矛盾特殊性',
    en: 'particularity of contradiction',
    definition: '每一具体事物的矛盾都有其特殊本质,要求具体问题具体分析。',
  },
  {
    term: '感性认识',
    en: 'perceptual knowledge',
    definition: '认识的初级阶段,通过感官直接接触事物而获得的现象层面的认识。',
  },
  {
    term: '理性认识',
    en: 'rational knowledge',
    definition: '认识的高级阶段,在感性材料基础上通过抽象思维把握事物的本质和规律。',
  },
  {
    term: '调查',
    en: 'investigation',
    definition: '深入实际、深入群众,通过开调查会等方式掌握第一手材料的工作方法。',
  },
  {
    term: '群众路线',
    en: 'mass line',
    definition: '从群众中来,到群众中去;一切为了群众,一切依靠群众的根本工作路线。',
  },
  {
    term: '阶级',
    en: 'class',
    definition: '在一定社会生产体系中处于不同地位、有着不同利益的社会集团。',
  },
  {
    term: '实事求是',
    en: 'seek truth from facts',
    definition: '从客观实际出发,按照事物的本来面目去认识和研究问题。',
  },
  {
    term: '具体问题具体分析',
    en: 'concrete analysis of concrete conditions',
    definition: '在矛盾普遍性原理的指导下,研究每一事物矛盾的特殊性,找出其特殊本质。',
  },
  {
    term: '武装夺取政权',
    en: 'seize political power by armed force',
    definition: '在半殖民地半封建的中国,革命的主要形式是武装斗争,主要组织形式是军队。',
  },
];

/**
 * Find the glossary entry that matches a free-text query. Returns the entry
 * plus the character range(s) of the match so the panel can highlight it.
 *
 * For Phase 2 we only return a single best match; multi-match highlighting
 * is left as a TODO if needed later.
 */
export interface GlossaryMatch {
  entry: GlossaryEntry;
  /** Where in `entry.term` (or aliases) the match was found. */
  matched: string;
}

export function searchGlossary(query: string): GlossaryMatch[] {
  const q = query.trim();
  if (!q) return [];
  const lower = q.toLowerCase();
  const results: GlossaryMatch[] = [];
  for (const entry of GLOSSARY) {
    if (entry.term.includes(q) || entry.term.toLowerCase().includes(lower)) {
      results.push({ entry, matched: entry.term });
      continue;
    }
    if (entry.en.toLowerCase().includes(lower)) {
      results.push({ entry, matched: entry.en });
      continue;
    }
    if (entry.aliases?.some((a) => a.includes(q) || a.toLowerCase().includes(lower))) {
      results.push({ entry, matched: entry.term });
    }
  }
  return results;
}
