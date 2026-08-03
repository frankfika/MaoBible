# Content release audit

Audit date: 2026-08-02

## Result

Public store submission is blocked on content quality and rights clearance.

- 22 article files checked.
- 18 English translations contain empty paragraphs or exact repeated paragraph text.
- `spark-1930` has 19 English paragraphs and all 19 are empty.
- The figures below count duplicate occurrences beyond the first exact copy within each article. Repeated section labels may account for a small number, but the high counts show systematic translation corruption.

| Article ID | English paragraphs | Empty | Duplicate occurrences |
|---|---:|---:|---:|
| anti-japan-strategy-1935 | 55 | 0 | 41 |
| communists-founding-1939 | 19 | 0 | 5 |
| hunan-peasant-movement-1927 | 75 | 0 | 67 |
| new-democracy-1940 | 139 | 0 | 123 |
| on-contradiction-1937 | 116 | 0 | 103 |
| on-practice-1937 | 27 | 0 | 19 |
| oppose-book-worship-1930 | 51 | 0 | 37 |
| oppose-party-stereotypes-1942 | 46 | 0 | 34 |
| party-role-1938 | 32 | 0 | 18 |
| peoples-democratic-dictatorship-1949 | 37 | 0 | 26 |
| postwar-situation-1945 | 19 | 0 | 7 |
| protracted-war-1938 | 239 | 0 | 129 |
| rectify-party-style-1942 | 46 | 0 | 33 |
| revolution-end-1949 | 15 | 0 | 1 |
| spark-1930 | 19 | 19 | 0 |
| strategy-civil-war-1936 | 235 | 0 | 215 |
| united-front-tactics-1940 | 13 | 0 | 1 |
| yanan-talks-1942 | 50 | 0 | 37 |

## Required evidence before release

- Written authorization or a formal jurisdiction-specific legal opinion covering public distribution of the Chinese source text and any edition-specific material.
- A documented provenance record for every English translation.
- Human review of every English paragraph against the corresponding Chinese paragraph.
- A second automated audit showing no empty body paragraphs, no systematic duplicate runs, and stable ID alignment.
- Reviewer name, review date, and `reviewed` or `published` status recorded per translation.

Machine translation may be used only as an internal draft. It must not be promoted to a public status without human review, in line with the repository content convention.
