import { normalizeServiceCategory } from "./controllers/chatController.js";

const levenshtein = (a, b) => {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
};

const hasFuzzyWordMatch = (queryText, targetWord, maxDistance = 2) => {
  const words = queryText.toLowerCase().split(/[\s,./?#@!$%^&*()_+={}[\]|\\:;"'-]+/);
  console.log(`Checking queryText: "${queryText}", words extracted:`, words);
  for (const w of words) {
    if (w.length < 3) continue;
    console.log(`Comparing "${w}" against "${targetWord}"`);
    if (w.includes(targetWord) || targetWord.includes(w)) {
      console.log(`  Match found: w.includes(targetWord) or targetWord.includes(w)`);
      return true;
    }
    const dist = levenshtein(w, targetWord);
    console.log(`  Levenshtein distance between "${w}" and "${targetWord}" is: ${dist}`);
    if (dist <= maxDistance) {
      console.log(`  Match found: Levenshtein distance <= ${maxDistance}`);
      return true;
    }
  }
  return false;
};

const query = "need a pluber";
console.log("Checking plumber keyword match:");
const res1 = hasFuzzyWordMatch(query, "plumber");
console.log("Match for plumber:", res1);

console.log("\nChecking pluber keyword match:");
const res2 = hasFuzzyWordMatch(query, "pluber");
console.log("Match for pluber:", res2);
