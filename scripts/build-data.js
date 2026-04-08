import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');
const OUT = join(__dirname, '..', 'public', 'data');

// ── Curated company tiers ──────────────────────────────────────────────
const TIERS = {
  faang: {
    label: 'FAANG / Big Tech',
    slugs: ['meta', 'amazon', 'apple', 'netflix', 'google', 'microsoft', 'nvidia'],
  },
  'top-tech': {
    label: 'Top Listed Tech',
    slugs: [
      'adobe', 'salesforce', 'oracle', 'cisco', 'intel', 'uber', 'airbnb',
      'spotify', 'snowflake', 'datadog', 'crowdstrike', 'cloudflare',
      'coinbase', 'pinterest', 'snapchat', 'dropbox', 'atlassian', 'docusign',
      'zoom', 'splunk', 'mongodb', 'confluent', 'palo-alto-networks',
      'servicenow', 'workday', 'intuit', 'paypal', 'ebay', 'twilio',
      'roblox', 'unity', 'etsy', 'doordash', 'robinhood', 'shopify',
      'reddit', 'palantir-technologies', 'linkedin', 'twitter', 'square',
    ],
  },
  unicorn: {
    label: 'High-Pay Unicorns',
    slugs: [
      'stripe', 'spacex', 'bytedance', 'openai', 'anthropic', 'databricks',
      'canva', 'figma', 'discord', 'plaid', 'anduril', 'scale-ai',
      'rippling', 'braze', 'notion', 'instacart', 'chime', 'revolut',
      'grammarly', 'cockroach-labs', 'cruise-automation', 'waymo', 'nuro',
      'aurora', 'zoox', 'rivian', 'lucid', 'applovin', 'duolingo', 'sofi',
      'affirm', 'marqeta', 'lyft', 'bolt', 'faire', 'gusto', 'toast',
      'samsara', 'rubrik', 'sambanova', 'moveworks', 'harness', 'postman',
      'sentry', 'lacework', 'ramp-2',
    ],
  },
  'indian-tech': {
    label: 'Indian Top Tech',
    slugs: [
      'flipkart', 'razorpay', 'phonepe', 'cred', 'swiggy', 'zomato',
      'dream11', 'meesho', 'groww', 'blinkit', 'paytm', 'zepto',
      'freshworks', 'browserstack', 'sharechat', 'nykaa', 'lenskart', 'myntra',
    ],
  },
};

// Build slug → tier map (first tier wins for dedup)
const slugToTier = new Map();
for (const [tierKey, { slugs }] of Object.entries(TIERS)) {
  for (const slug of slugs) {
    if (!slugToTier.has(slug)) slugToTier.set(slug, tierKey);
  }
}

const CSV_FILES = {
  all: 'all.csv',
  thirtyDays: 'thirty-days.csv',
  threeMonths: 'three-months.csv',
  sixMonths: 'six-months.csv',
  moreThanSixMonths: 'more-than-six-months.csv',
};

// ── CSV parser (handles quoted fields) ─────────────────────────────────
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseCSV(filePath) {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length <= 1) return []; // header only or empty
  return lines.slice(1).map(line => {
    const [id, url, title, difficulty, acceptance, frequency] = parseCSVLine(line);
    return {
      id: parseInt(id, 10),
      url,
      title,
      difficulty,
      acceptance: acceptance?.replace('%', '') || '0',
      frequency: frequency?.replace('%', '') || '0',
    };
  }).filter(q => !isNaN(q.id));
}

function slugToName(slug) {
  const overrides = {
    'meta': 'Meta', 'amazon': 'Amazon', 'apple': 'Apple', 'netflix': 'Netflix',
    'google': 'Google', 'microsoft': 'Microsoft', 'nvidia': 'NVIDIA',
    'adobe': 'Adobe', 'salesforce': 'Salesforce', 'oracle': 'Oracle',
    'cisco': 'Cisco', 'intel': 'Intel', 'uber': 'Uber', 'airbnb': 'Airbnb',
    'spotify': 'Spotify', 'snowflake': 'Snowflake', 'datadog': 'Datadog',
    'crowdstrike': 'CrowdStrike', 'cloudflare': 'Cloudflare', 'coinbase': 'Coinbase',
    'pinterest': 'Pinterest', 'snapchat': 'Snapchat', 'dropbox': 'Dropbox',
    'atlassian': 'Atlassian', 'docusign': 'DocuSign', 'zoom': 'Zoom',
    'splunk': 'Splunk', 'mongodb': 'MongoDB', 'confluent': 'Confluent',
    'palo-alto-networks': 'Palo Alto Networks', 'servicenow': 'ServiceNow',
    'workday': 'Workday', 'intuit': 'Intuit', 'paypal': 'PayPal', 'ebay': 'eBay',
    'twilio': 'Twilio', 'roblox': 'Roblox', 'unity': 'Unity', 'etsy': 'Etsy',
    'doordash': 'DoorDash', 'robinhood': 'Robinhood', 'shopify': 'Shopify',
    'reddit': 'Reddit', 'palantir-technologies': 'Palantir', 'linkedin': 'LinkedIn',
    'twitter': 'Twitter', 'square': 'Square', 'stripe': 'Stripe', 'spacex': 'SpaceX',
    'bytedance': 'ByteDance', 'openai': 'OpenAI', 'anthropic': 'Anthropic',
    'databricks': 'Databricks', 'canva': 'Canva', 'figma': 'Figma',
    'discord': 'Discord', 'plaid': 'Plaid', 'anduril': 'Anduril',
    'scale-ai': 'Scale AI', 'rippling': 'Rippling', 'braze': 'Braze',
    'notion': 'Notion', 'instacart': 'Instacart', 'chime': 'Chime',
    'revolut': 'Revolut', 'grammarly': 'Grammarly',
    'cockroach-labs': 'Cockroach Labs', 'cruise-automation': 'Cruise',
    'waymo': 'Waymo', 'nuro': 'Nuro', 'aurora': 'Aurora', 'zoox': 'Zoox',
    'rivian': 'Rivian', 'lucid': 'Lucid', 'applovin': 'AppLovin',
    'duolingo': 'Duolingo', 'sofi': 'SoFi', 'affirm': 'Affirm',
    'marqeta': 'Marqeta', 'lyft': 'Lyft', 'bolt': 'Bolt', 'faire': 'Faire',
    'gusto': 'Gusto', 'toast': 'Toast', 'samsara': 'Samsara', 'rubrik': 'Rubrik',
    'sambanova': 'SambaNova', 'moveworks': 'Moveworks', 'harness': 'Harness',
    'postman': 'Postman', 'sentry': 'Sentry', 'lacework': 'Lacework',
    'ramp-2': 'Ramp', 'flipkart': 'Flipkart', 'razorpay': 'Razorpay',
    'phonepe': 'PhonePe', 'cred': 'CRED', 'swiggy': 'Swiggy', 'zomato': 'Zomato',
    'dream11': 'Dream11', 'meesho': 'Meesho', 'groww': 'Groww',
    'blinkit': 'Blinkit', 'paytm': 'Paytm', 'zepto': 'Zepto',
    'freshworks': 'Freshworks', 'browserstack': 'BrowserStack',
    'sharechat': 'ShareChat', 'nykaa': 'Nykaa', 'lenskart': 'Lenskart',
    'myntra': 'Myntra',
  };
  return overrides[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Main ───────────────────────────────────────────────────────────────
function build() {
  mkdirSync(join(OUT, 'companies'), { recursive: true });

  const companiesList = [];
  const questionIndex = {}; // id → { title, difficulty, url, companies[] }
  let processed = 0;
  let skipped = 0;

  for (const [slug, tier] of slugToTier) {
    const companyDir = join(ROOT, slug);
    if (!existsSync(companyDir)) {
      console.warn(`  SKIP ${slug} — folder not found`);
      skipped++;
      continue;
    }

    const periods = {};
    const counts = {};
    for (const [periodKey, csvFile] of Object.entries(CSV_FILES)) {
      const questions = parseCSV(join(companyDir, csvFile));
      periods[periodKey] = questions;
      counts[periodKey] = questions.length;
    }

    // Write per-company JSON
    writeFileSync(
      join(OUT, 'companies', `${slug}.json`),
      JSON.stringify(periods)
    );

    companiesList.push({
      slug,
      name: slugToName(slug),
      tier,
      counts,
    });

    // Update question index from "all" period
    for (const q of periods.all) {
      if (!questionIndex[q.id]) {
        questionIndex[q.id] = {
          title: q.title,
          difficulty: q.difficulty,
          url: q.url,
          topic: q.topic || 'Other',
          topicTags: q.topicTags || [],
          companies: [],
        };
      }
      if (!questionIndex[q.id].companies.includes(slug)) {
        questionIndex[q.id].companies.push(slug);
      }
    }

    processed++;
  }

  // Sort companies alphabetically within each tier
  companiesList.sort((a, b) => {
    const tierOrder = ['faang', 'top-tech', 'unicorn', 'indian-tech'];
    const ta = tierOrder.indexOf(a.tier);
    const tb = tierOrder.indexOf(b.tier);
    if (ta !== tb) return ta - tb;
    return a.name.localeCompare(b.name);
  });

  writeFileSync(join(OUT, 'companies.json'), JSON.stringify(companiesList));
  writeFileSync(join(OUT, 'question-index.json'), JSON.stringify(questionIndex));

  console.log(`\n✅ Build complete!`);
  console.log(`   Companies processed: ${processed}`);
  console.log(`   Companies skipped:   ${skipped}`);
  console.log(`   Unique questions:    ${Object.keys(questionIndex).length}`);
  console.log(`   Output directory:    ${OUT}`);
}

build();
