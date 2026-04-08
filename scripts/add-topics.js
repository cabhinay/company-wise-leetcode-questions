/**
 * Fetches LeetCode topic tags via GraphQL API and adds them to all company JSON files.
 * Usage: node scripts/add-topics.js
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const COMPANIES_DIR = join(__dirname, '..', 'public', 'data', 'companies');

// ── Step 1: Collect all unique question IDs ────────────────────────────
function collectAllIds() {
  const ids = new Set();
  for (const file of readdirSync(COMPANIES_DIR)) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(readFileSync(join(COMPANIES_DIR, file), 'utf-8'));
    for (const period of Object.values(data)) {
      if (!Array.isArray(period)) continue;
      for (const q of period) {
        ids.add(q.id);
      }
    }
  }
  return ids;
}

// ── Step 2: Fetch topics from LeetCode GraphQL API ─────────────────────
async function fetchTopicsFromLeetCode() {
  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        total: totalNum
        questions: data {
          frontendQuestionId: questionFrontendId
          topicTags {
            name
            slug
          }
        }
      }
    }
  `;

  const idToTopics = {};
  const batchSize = 100;
  let skip = 0;
  let total = Infinity;

  while (skip < total) {
    process.stdout.write(`\r  Fetching problems ${skip}–${skip + batchSize}...`);
    try {
      const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            categorySlug: '',
            skip,
            limit: batchSize,
            filters: {},
          },
        }),
      });

      if (!res.ok) {
        console.error(`\nHTTP ${res.status}: ${res.statusText}`);
        break;
      }

      const json = await res.json();
      const list = json?.data?.problemsetQuestionList;
      if (!list) {
        console.error('\nUnexpected response:', JSON.stringify(json).slice(0, 500));
        break;
      }

      total = list.total;
      for (const q of list.questions) {
        const id = parseInt(q.frontendQuestionId, 10);
        if (!isNaN(id) && q.topicTags?.length) {
          idToTopics[id] = q.topicTags.map(t => t.name);
        }
      }
    } catch (err) {
      console.error(`\nFetch error at skip=${skip}: ${err.message}`);
      // Retry after a longer delay
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }

    skip += batchSize;
    // Small delay to be respectful
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(); // newline after progress

  return idToTopics;
}

// ── Step 3: Assign a single primary topic per question ─────────────────
// Priority order for picking the "main" topic
const TOPIC_PRIORITY = [
  'Dynamic Programming',
  'Binary Search',
  'Depth-First Search',
  'Breadth-First Search',
  'Graph',
  'Tree',
  'Binary Tree',
  'Trie',
  'Linked List',
  'Stack',
  'Monotonic Stack',
  'Queue',
  'Heap (Priority Queue)',
  'Sliding Window',
  'Two Pointers',
  'Backtracking',
  'Divide and Conquer',
  'Union Find',
  'Segment Tree',
  'Binary Indexed Tree',
  'Topological Sort',
  'Greedy',
  'Bit Manipulation',
  'Design',
  'Recursion',
  'Matrix',
  'Hash Table',
  'Sorting',
  'String',
  'Array',
  'Math',
  'Prefix Sum',
  'Simulation',
  'Counting',
  'Database',
];

function pickPrimaryTopic(tags) {
  if (!tags || !tags.length) return 'Other';
  for (const priority of TOPIC_PRIORITY) {
    if (tags.includes(priority)) return priority;
  }
  return tags[0]; // fallback to first tag
}

// ── Step 4: Title-based fallback for questions not in API ──────────────
function inferTopicFromTitle(title) {
  const t = title.toLowerCase();
  if (/\btree\b|bst\b|binary tree|preorder|inorder|postorder|treenode/.test(t)) return 'Tree';
  if (/\blinked list\b|listnode/.test(t)) return 'Linked List';
  if (/\bgraph\b|network|shortest path|dijkstra|bellman/.test(t)) return 'Graph';
  if (/\btrie\b|prefix tree/.test(t)) return 'Trie';
  if (/\bstack\b/.test(t)) return 'Stack';
  if (/\bqueue\b|deque/.test(t)) return 'Queue';
  if (/\bheap\b|priority queue/.test(t)) return 'Heap (Priority Queue)';
  if (/\bmatrix\b|grid\b|2d array/.test(t)) return 'Matrix';
  if (/\bdp\b|dynamic programming|knapsack|subsequence|subproblem/.test(t)) return 'Dynamic Programming';
  if (/\bbinary search\b/.test(t)) return 'Binary Search';
  if (/\bsliding window\b/.test(t)) return 'Sliding Window';
  if (/\btwo pointer/.test(t)) return 'Two Pointers';
  if (/\bbacktrack/.test(t)) return 'Backtracking';
  if (/\bsort\b|sorting|sorted/.test(t)) return 'Sorting';
  if (/\bpalindrome\b|substring|string|anagram|character/.test(t)) return 'String';
  if (/\barray\b|subarray|sum/.test(t)) return 'Array';
  if (/\bisland\b|dfs|bfs|flood fill/.test(t)) return 'Depth-First Search';
  if (/\bsql\b|table|employee|customer|salary|department|manager/.test(t)) return 'Database';
  if (/\bdesign\b|implement|lru|lfu|cache/.test(t)) return 'Design';
  if (/\bbit\b|bitwise|xor\b|and\b|or\b/.test(t)) return 'Bit Manipulation';
  if (/\bmath\b|prime|sqrt|power|factorial|roman|integer/.test(t)) return 'Math';
  if (/\bgreedy\b|jump game|gas station|interval/.test(t)) return 'Greedy';
  if (/\bhash\b|map\b|set\b|duplicate/.test(t)) return 'Hash Table';
  return 'Other';
}

// ── Step 5: Update all company JSON files ──────────────────────────────
function updateCompanyFiles(idToTopics) {
  const files = readdirSync(COMPANIES_DIR).filter(f => f.endsWith('.json'));
  let updated = 0;
  let questionsUpdated = 0;
  let fallbackCount = 0;

  for (const file of files) {
    const filePath = join(COMPANIES_DIR, file);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    let changed = false;

    for (const [period, questions] of Object.entries(data)) {
      if (!Array.isArray(questions)) continue;
      for (const q of questions) {
        const tags = idToTopics[q.id];
        if (tags) {
          q.topic = pickPrimaryTopic(tags);
          q.topicTags = tags;
        } else {
          q.topic = inferTopicFromTitle(q.title);
          q.topicTags = [q.topic];
          fallbackCount++;
        }
        questionsUpdated++;
        changed = true;
      }
    }

    if (changed) {
      writeFileSync(filePath, JSON.stringify(data));
      updated++;
    }
  }

  return { updated, questionsUpdated, fallbackCount };
}

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  const allIds = collectAllIds();
  console.log(`Found ${allIds.size} unique question IDs across all companies`);

  console.log('\nFetching topic tags from LeetCode API...');
  const idToTopics = await fetchTopicsFromLeetCode();
  console.log(`Fetched topics for ${Object.keys(idToTopics).length} problems`);

  // Check coverage
  let covered = 0;
  for (const id of allIds) {
    if (idToTopics[id]) covered++;
  }
  console.log(`Coverage: ${covered}/${allIds.size} (${((covered / allIds.size) * 100).toFixed(1)}%)`);

  console.log('\nUpdating company JSON files...');
  const { updated, questionsUpdated, fallbackCount } = updateCompanyFiles(idToTopics);
  console.log(`\n✅ Done!`);
  console.log(`   Files updated: ${updated}`);
  console.log(`   Questions updated: ${questionsUpdated}`);
  console.log(`   Fallback (title-based): ${fallbackCount}`);
}

main().catch(console.error);
