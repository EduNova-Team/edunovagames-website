const fs = require("fs");
const path = require("path");

// Read the Personal Finance questions text file
const personalFinanceText = fs.readFileSync(
  "c:/Users/manue/Downloads/Personal Finance.txt",
  "utf8"
);

const questions = [];
const lines = personalFinanceText.split("\n");

let currentQuestionText = null;
let currentOptions = {};
let currentCorrectAnswer = null;
let currentExplanation = "";
let currentDifficulty = "Medium";
let questionBuffer = [];
let parsingCompact = false;

function flushQuestion() {
  if (
    currentQuestionText &&
    Object.keys(currentOptions).length === 4 &&
    currentCorrectAnswer &&
    currentExplanation
  ) {
    questions.push({
      id: questions.length + 1,
      question: currentQuestionText,
      options: { ...currentOptions },
      correctAnswer: currentCorrectAnswer,
      explanation: currentExplanation,
      difficulty: currentDifficulty,
    });
    console.log(
      `Parsed question ${questions.length}: ${currentQuestionText.substring(
        0,
        50
      )}...`
    );
  }
  currentQuestionText = null;
  currentOptions = {};
  currentCorrectAnswer = null;
  currentExplanation = "";
  currentDifficulty = "Medium";
  parsingCompact = false;
}

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (!line) continue;

  // Ignore section headers
  if (
    /^[A-Z][A-Za-z\s&]+:$/.test(line) &&
    !/^\d+\./.test(line) &&
    !line.startsWith("Answer:") &&
    !line.startsWith("Explanation:") &&
    !line.startsWith("Difficulty:")
  ) {
    continue;
  }

  // Detect new question (classic or compact)
  let questionMatch = line.match(/^(\d+)\.\s*(.+)$/);
  if (questionMatch) {
    flushQuestion();
    currentQuestionText = questionMatch[2].trim();
    // If the next line is not an option, we're in compact mode
    let lookahead = lines[i + 1] ? lines[i + 1].trim() : "";
    if (!lookahead.match(/^([A-D])\./) && !lookahead.match(/^A\)/)) {
      parsingCompact = true;
    }
    continue;
  }

  // Classic format: Option lines (A. ...)
  let optionMatch = line.match(/^([A-D])\.\s*(.+)$/);
  if (optionMatch) {
    currentOptions[optionMatch[1]] = optionMatch[2].trim();
    console.log(
      `  Option ${optionMatch[1]}: ${optionMatch[2].substring(0, 30)}...`
    );
    continue;
  }

  // Compact format: Option lines (A) ... or A) ...
  let compactOptionMatch = line.match(/^([A-D])\)\s*(.+)$/);
  if (compactOptionMatch) {
    currentOptions[compactOptionMatch[1]] = compactOptionMatch[2].trim();
    continue;
  }

  // Compact format: Indented options (e.g., 4 spaces or tab)
  let indentedOptionMatch = lines[i].match(/^\s{2,}([A-D])\)\s*(.+)$/);
  if (indentedOptionMatch) {
    currentOptions[indentedOptionMatch[1]] = indentedOptionMatch[2].trim();
    continue;
  }

  // If in compact mode, try to find options in the next 4 lines
  if (parsingCompact && Object.keys(currentOptions).length < 4) {
    let compactOpt = line.match(/^([A-Da-d])\)\s*(.+)$/);
    if (compactOpt) {
      currentOptions[compactOpt[1].toUpperCase()] = compactOpt[2].trim();
      continue;
    }
    // Sometimes options are just indented without a letter
    let noLetterOpt = line.match(/^\s{2,}(.+)$/);
    if (noLetterOpt && Object.keys(currentOptions).length < 4) {
      // Assign to next available letter
      const letters = ["A", "B", "C", "D"];
      let nextLetter = letters[Object.keys(currentOptions).length];
      currentOptions[nextLetter] = noLetterOpt[1].trim();
      continue;
    }
  }

  // Answer
  if (line.startsWith("Answer:")) {
    let ans = line.split(":")[1].trim();
    // Accept both "A" and "A)" or "A." as valid answers
    let ansLetter = ans.match(/^([A-Da-d])/);
    if (ansLetter) {
      currentCorrectAnswer = ansLetter[1].toUpperCase();
    } else {
      currentCorrectAnswer = ans;
    }
    console.log(`  Answer: ${currentCorrectAnswer}`);
    continue;
  }

  // Explanation
  if (line.startsWith("Explanation:")) {
    currentExplanation = line.split(":")[1].trim();
    console.log(`  Explanation: ${currentExplanation.substring(0, 30)}...`);
    continue;
  }

  // Difficulty
  if (line.startsWith("Difficulty:")) {
    const difficultyText = line.split(":")[1].trim();
    if (difficultyText === "★") {
      currentDifficulty = "Easy";
    } else if (difficultyText === "★★") {
      currentDifficulty = "Medium";
    } else if (difficultyText === "★★★") {
      currentDifficulty = "Hard";
    }
    console.log(`  Difficulty: ${currentDifficulty}`);
    continue;
  }

  // If it's a continuation of the explanation
  if (
    currentExplanation &&
    !optionMatch &&
    !line.startsWith("Answer:") &&
    !line.startsWith("Difficulty:")
  ) {
    currentExplanation += " " + line;
  }
}
flushQuestion();

// Write to JSON file
const outputPath = path.join(
  __dirname,
  "../src/data/fbla-questions/personal-finance.json"
);
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));

console.log(
  `Successfully converted ${questions.length} questions from text file`
);
console.log(`Output saved to: ${outputPath}`);

// Log some statistics
const difficultyCounts = questions.reduce((acc, q) => {
  acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
  return acc;
}, {});

console.log("\nDifficulty distribution:");
Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
  console.log(`${difficulty}: ${count} questions`);
});
