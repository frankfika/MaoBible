/**
 * Article manifest — small index bundled with the app.
 * Full article content lives in /public/content/{id}.json (fetched at runtime,
 * cached by the service worker for offline access).
 */
import type { ArticleMetadata } from '@/types';

export const ARTICLES: ArticleMetadata[] = [
  // --- Phase 1 originals ---
  {
    id: 'hunan-peasant-movement-1927',
    title: '湖南农民运动考察报告',
    subtitle: '1927',
    author: '毛泽东',
    writtenAt: '1927-03',
    readingMinutes: 28,
    volume: '《毛泽东选集》第一卷',
    themes: ['调查', '群众', '组织', '革命'],
    summary:
      '针对党内对农民运动的责难而作的实地考察报告。毛泽东用三十二天走访湖南五县，提出「贫农是革命先锋」的判断，奠定农村调查的方法。',
    reflectionPrompt:
      '「没有调查就没有发言权」——你最近一次对一个陌生领域形成判断，是基于第一手材料，还是基于道听途说？',
  },
  {
    id: 'on-practice-1937',
    title: '实践论',
    subtitle: '论认识和实践的关系——知和行的关系',
    author: '毛泽东',
    writtenAt: '1937-07',
    readingMinutes: 22,
    volume: '《毛泽东选集》第一卷',
    themes: ['实践', '认识论', '辩证法', '学习'],
    summary:
      '为总结中国革命经验、肃清教条主义而写的哲学论文。系统论述实践—认识—再实践的循环，确立「通过实践检验真理」的认识路线。',
    reflectionPrompt:
      '你最近学到的某个「道理」，有没有回到现实里被检验过？它经得住哪些具体场景？',
  },
  {
    id: 'on-contradiction-1937',
    title: '矛盾论',
    subtitle: '唯物辩证法最根本的法则',
    author: '毛泽东',
    writtenAt: '1937-08',
    readingMinutes: 26,
    volume: '《毛泽东选集》第一卷',
    themes: ['矛盾', '辩证法', '分析', '方法'],
    summary:
      '与《实践论》姊妹篇。系统阐释对立统一规律，提出「矛盾普遍性」与「矛盾特殊性」的分析框架，强调具体问题具体分析。',
    reflectionPrompt:
      '在今天的某个具体决定里，主要矛盾和次要矛盾分别是什么？哪一边被你忽略了？',
  },

  // --- Phase 2 additions (1925–1936) ---
  {
    id: 'classes-analysis-1925',
    title: '中国社会各阶级的分析',
    subtitle: '1925',
    author: '毛泽东',
    writtenAt: '1925-12-01',
    readingMinutes: 18,
    volume: '《毛泽东选集》第一卷',
    themes: ['阶级', '分析', '统一战线', '革命'],
    summary:
      '毛泽东思想的萌芽之作。系统分析中国社会中地主阶级和买办阶级、民族资产阶级、小资产阶级、半无产阶级、无产阶级五大势力的政治态度，回答「谁是我们的敌人？谁是我们的朋友？」',
    reflectionPrompt:
      '今天你的工作里，谁是「敌人」（消耗你注意力的事）谁是「朋友」（真正创造价值的事）？分清了吗？',
  },
  {
    id: 'spark-1930',
    title: '星星之火,可以燎原',
    subtitle: '1930',
    author: '毛泽东',
    writtenAt: '1930-01-05',
    readingMinutes: 18,
    volume: '《毛泽东选集》第一卷',
    themes: ['革命', '信心', '农村', '战略'],
    summary:
      '答复林彪「红旗到底打得多久」的疑问，提出「农村包围城市、武装夺取政权」的中国革命道路雏形，是毛泽东思想形成的重要标志。',
    reflectionPrompt:
      '你现在做的这件看似微小的事，三五年后能否「燎原」？支撑你继续做的核心信念是什么？',
  },
  {
    id: 'oppose-book-worship-1930',
    title: '反对本本主义',
    subtitle: '1930',
    author: '毛泽东',
    writtenAt: '1930-05',
    readingMinutes: 12,
    volume: '《毛泽东选集》第一卷',
    themes: ['调查', '实事求是', '思想路线'],
    summary:
      '中共党内第一篇反对教条主义的文献，第一次提出「没有调查就没有发言权」，标志着党的实事求是思想路线的初步形成。',
    reflectionPrompt:
      '你最近一次被某条「行业共识」或「权威说法」卡住决策，是什么时候？你去验证了吗？',
  },
  {
    id: 'masses-life-1934',
    title: '关心群众生活,注意工作方法',
    subtitle: '1934',
    author: '毛泽东',
    writtenAt: '1934-01-27',
    readingMinutes: 10,
    volume: '《毛泽东选集》第一卷',
    themes: ['群众', '工作方法', '关心'],
    summary:
      '在中央苏区严重困难时期写作，强调革命战争必须与群众生活问题结合起来，批评官僚主义工作方法。',
    reflectionPrompt:
      '你这周有没有真正了解过一个具体的人（同事/用户）今天过得怎么样，不只是看指标？',
  },
  {
    id: 'anti-japan-strategy-1935',
    title: '论反对日本帝国主义的策略',
    subtitle: '1935',
    author: '毛泽东',
    writtenAt: '1935-12-27',
    readingMinutes: 16,
    volume: '《毛泽东选集》第一卷',
    themes: ['抗日', '统一战线', '策略'],
    summary:
      '瓦窑堡会议讲话和结论。系统论证建立抗日民族统一战线的可能性与必要性，批评党内「左」倾关门主义。',
    reflectionPrompt:
      '面对一个压倒性的共同威胁，你愿意暂时放下次要分歧、扩大同盟吗？哪些分歧是真的次要？',
  },
  {
    id: 'strategy-civil-war-1936',
    title: '中国革命战争的战略问题',
    subtitle: '1936',
    author: '毛泽东',
    writtenAt: '1936-12',
    readingMinutes: 32,
    volume: '《毛泽东选集》第一卷',
    themes: ['战略', '军事', '认识论'],
    summary:
      '总结土地革命战争经验，系统论述中国革命战争的四个特点与战略战术原则，是《矛盾论》《实践论》思想在军事领域的具体化。',
    reflectionPrompt:
      '你当前面对的难题里，有没有「敌强我弱但敌小我大、敌退步我进步」这种结构性差异可以利用？',
  },

  // --- Phase 2 additions (1937–1940) ---
  {
    id: 'protracted-war-1938',
    title: '论持久战',
    subtitle: '1938',
    author: '毛泽东',
    writtenAt: '1938-05-26',
    readingMinutes: 36,
    volume: '《毛泽东选集》第二卷',
    themes: ['战略', '持久', '抗战', '认识论'],
    summary:
      '抗日战争中期的总结性论文。批驳「亡国论」和「速胜论」，预见了战争将经历防御、相持、反攻三个阶段，确立「兵民是胜利之本」的核心论点。',
    reflectionPrompt:
      '面对一场漫长、消耗巨大的事，你如何在 6 个月内不放弃，又不在一年内精疲力竭？',
  },
  {
    id: 'party-role-1938',
    title: '中国共产党在民族战争中的地位',
    subtitle: '1938',
    author: '毛泽东',
    writtenAt: '1938-10-14',
    readingMinutes: 22,
    volume: '《毛泽东选集》第二卷',
    themes: ['党', '统一战线', '领导'],
    summary:
      '六届六中全会的报告与结论。系统论述党在抗日民族统一战线中的独立性、领导权问题，以及党员在民族战争中的模范作用。',
    reflectionPrompt:
      '加入一个更大同盟时，你如何在不丧失自身定位的前提下，为共同目标做贡献？',
  },
  {
    id: 'communists-founding-1939',
    title: '《共产党人》发刊词',
    subtitle: '1939',
    author: '毛泽东',
    writtenAt: '1939-10-04',
    readingMinutes: 14,
    volume: '《毛泽东选集》第二卷',
    themes: ['党', '三大法宝', '统一战线'],
    summary:
      '中共首次提出「三大法宝」（统一战线、武装斗争、党的建设）。论证马列主义理论和中国革命实践相结合，第一次把党的建设称为「伟大的工程」。',
    reflectionPrompt:
      '你所在的组织现在最该强化的「法宝」是哪个？制度、行动，还是自身能力？',
  },
  {
    id: 'new-democracy-1940',
    title: '新民主主义论',
    subtitle: '1940',
    author: '毛泽东',
    writtenAt: '1940-01-09',
    readingMinutes: 40,
    volume: '《毛泽东选集》第二卷',
    themes: ['新民主主义', '文化', '政治', '经济'],
    summary:
      '系统提出「新民主主义革命」理论。论证中国革命必须分两步走——新民主主义革命与社会主义革命——首次完整提出新民主主义的政治、经济、文化纲领。',
    reflectionPrompt:
      '一个长期目标和一个近期目标不冲突时，你怎么避免被近期目标「吸走」全部注意力？',
  },

  // --- Phase 2 additions (1942–1949) ---
  {
    id: 'yanan-talks-1942',
    title: '在延安文艺座谈会上的讲话',
    subtitle: '1942',
    author: '毛泽东',
    writtenAt: '1942-05-02',
    readingMinutes: 24,
    volume: '《毛泽东选集》第三卷',
    themes: ['文艺', '为人民服务', '立场'],
    summary:
      '延安整风运动的一部分。确立「文艺为工农兵服务」的方向，区分「为什么人的问题」为根本问题、原则问题。',
    reflectionPrompt:
      '你做的「作品」（代码、设计、报告、邮件）服务于谁？他们的真实处境你了解多少？',
  },
  {
    id: 'peoples-democratic-dictatorship-1949',
    title: '论人民民主专政',
    subtitle: '1949',
    author: '毛泽东',
    writtenAt: '1949-06-30',
    readingMinutes: 28,
    volume: '《毛泽东选集》第四卷',
    themes: ['人民民主专政', '建国', '阶级'],
    summary:
      '为新中国奠基的理论文献。系统论述「人民民主专政」的必要性与基本任务：「对人民内部的民主方面和对反动派的专政方面，互相结合起来」。',
    reflectionPrompt:
      '当你的「团队」需要明确边界（谁能进，谁不能进）时，你用什么标准？',
  },

  // --- Phase 2 additions (1940–1942, 统一战线 + 整风) ---
  {
    id: 'united-front-tactics-1940',
    title: '目前抗日统一战线中的策略问题',
    subtitle: '1940',
    author: '毛泽东',
    writtenAt: '1940-03-11',
    readingMinutes: 14,
    volume: '《毛泽东选集》第二卷',
    themes: ['统一战线', '策略', '中间派'],
    summary:
      '首次系统提出「发展进步势力、争取中间势力、孤立顽固势力」的策略总方针，以及对顽固派斗争的「有理、有利、有节」原则。',
    reflectionPrompt:
      '你能不能把合作的人分成三类——可以依靠的、要争取的、要孤立的——然后给三类分别设计不同的策略？',
  },
  {
    id: 'rectify-party-style-1942',
    title: '整顿党的作风',
    subtitle: '1942',
    author: '毛泽东',
    writtenAt: '1942-02-01',
    readingMinutes: 18,
    volume: '《毛泽东选集》第三卷',
    themes: ['党', '作风', '实事求是'],
    summary:
      '延安整风运动的开端。系统批判「主观主义、宗派主义、党八股」三种歪风，提出「实事求是」的根本态度和「惩前毖后、治病救人」的方针。',
    reflectionPrompt:
      '你最近学到一个理论后，有真的用它解决过现实问题吗？如果没有，你只是记住了「它」，不是学会了它。',
  },
  {
    id: 'oppose-party-stereotypes-1942',
    title: '反对党八股',
    subtitle: '1942',
    author: '毛泽东',
    writtenAt: '1942-02-08',
    readingMinutes: 12,
    volume: '《毛泽东选集》第三卷',
    themes: ['文风', '党八股', '方法'],
    summary:
      '列举党八股的八大罪状——空话连篇、装腔作势、无的放矢、语言无味、甲乙丙丁、不负责任、乱骂人等——提出「生动活泼新鲜有力」的文风标准。',
    reflectionPrompt:
      '你最近写的文字里，有几句是真话、几句是套话？能不能把它从「八股」里解放出来？',
  },
  {
    id: 'bethune-1939',
    title: '纪念白求恩',
    subtitle: '1939',
    author: '毛泽东',
    writtenAt: '1939-12-21',
    readingMinutes: 8,
    volume: '《毛泽东选集》第二卷',
    themes: ['国际主义', '为人民服务', '精神'],
    summary:
      '为纪念因救治八路军伤员而牺牲的加拿大医生白求恩而作。号召学习他「毫不利己专门利人」的精神，做「一个高尚的人，一个纯粹的人，一个有道德的人，一个脱离了低级趣味的人，一个有益于人民的人」。',
    reflectionPrompt:
      '你愿意为一件你相信的事，做到什么程度？愿意放弃舒适吗？愿意冒风险吗？',
  },
  {
    id: 'serve-people-1944',
    title: '为人民服务',
    subtitle: '1944',
    author: '毛泽东',
    writtenAt: '1944-09-08',
    readingMinutes: 8,
    volume: '《毛泽东选集》第三卷',
    themes: ['为人民服务', '生死', '群众'],
    summary:
      '在延安中央警备团追悼张思德的会上的讲演，后来成为中国共产党根本宗旨的核心表述。「为人民利益而死，就比泰山还重。」',
    reflectionPrompt:
      '你做的那些事，要是没人看到、没人知道、没人感谢，你还做不做？',
  },

  // --- Phase 2 additions (1945–1949) ---
  {
    id: 'postwar-situation-1945',
    title: '抗日战争胜利后的时局和我们的方针',
    subtitle: '1945',
    author: '毛泽东',
    writtenAt: '1945-08-13',
    readingMinutes: 14,
    volume: '《毛泽东选集》第四卷',
    themes: ['战略', '时局', '斗争'],
    summary:
      '抗日战争刚胜利时的关键讲演。预见到蒋介石集团必然抢夺胜利果实、发动内战，提出「针锋相对，寸土必争」的方针，要求全党对「和平」阴谋保持高度警惕。',
    reflectionPrompt:
      '对手刚刚从一场大战里脱身，会急着抢什么？你能在别人都松懈的时候提前想到吗？',
  },
  {
    id: 'revolution-end-1949',
    title: '将革命进行到底',
    subtitle: '1948年12月30日,新华社献词',
    author: '毛泽东',
    writtenAt: '1948-12-30',
    readingMinutes: 14,
    volume: '《毛泽东选集》第四卷',
    themes: ['革命', '决心', '总结'],
    summary:
      '在人民解放战争取得决定性胜利时的新年献词。用古希腊「农夫与蛇」的寓言警示对反动派的仁慈就是犯罪，提出「将革命进行到底」的口号。',
    reflectionPrompt:
      '做对的事情在中途放弃，是不是对前面所有努力的最大浪费？',
  },
];

export function getArticleMeta(id: string): ArticleMetadata | undefined {
  return ARTICLES.find((a) => a.id === id);
}
