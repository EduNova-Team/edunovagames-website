const fs = require("fs");
const path = require("path");

// === Adapted for Personal Finance ===
const personalFinanceText = fs.readFileSync(
  "c:/Users/manue/Downloads/Personal Finance.txt",
  "utf8"
);

// Parse the questions
const questions = [];
const lines = personalFinanceText.split("\n");

let currentQuestion = null;
let currentOptions = {};
let currentExplanation = "";
let currentDifficulty = "Medium"; // Default difficulty

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (!line) continue;

  // Check if this is a new question (starts with a number)
  const questionMatch = line.match(/^(\d+)\.\s+(.+)$/);
  if (questionMatch) {
    // Save previous question if exists
    if (currentQuestion) {
      questions.push({
        id: parseInt(currentQuestion.id),
        question: currentQuestion.text,
        options: currentOptions,
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentExplanation,
        difficulty: currentDifficulty,
      });
    }

    // Start new question
    currentQuestion = {
      id: questionMatch[1],
      text: questionMatch[2],
    };
    currentOptions = {};
    currentExplanation = "";
    currentDifficulty = "Medium";
    continue;
  }

  // Check for options (A, B, C, D)
  const optionMatch = line.match(/^([A-D])\.\s+(.+)$/);
  if (optionMatch && currentQuestion) {
    currentOptions[optionMatch[1]] = optionMatch[2];
    continue;
  }

  // Check for answer
  if (line.startsWith("Answer:") && currentQuestion) {
    currentQuestion.correctAnswer = line.split(":")[1].trim();
    continue;
  }

  // Check for explanation
  if (line.startsWith("Explanation:") && currentQuestion) {
    currentExplanation = line.split(":")[1].trim();
    continue;
  }

  // Check for difficulty
  if (line.startsWith("Difficulty:") && currentQuestion) {
    const difficultyText = line.split(":")[1].trim();
    if (difficultyText === "★") {
      currentDifficulty = "Easy";
    } else if (difficultyText === "★★") {
      currentDifficulty = "Medium";
    } else if (difficultyText === "★★★") {
      currentDifficulty = "Hard";
    }
    continue;
  }

  // If we have a current question and this line doesn't match any pattern,
  // it might be a continuation of the explanation
  if (
    currentQuestion &&
    currentExplanation &&
    !line.match(/^[A-D]\./) &&
    !line.startsWith("Answer:") &&
    !line.startsWith("Difficulty:")
  ) {
    currentExplanation += " " + line;
  }
}

// Add the last question
if (currentQuestion) {
  questions.push({
    id: parseInt(currentQuestion.id),
    question: currentQuestion.text,
    options: currentOptions,
    correctAnswer: currentQuestion.correctAnswer,
    explanation: currentExplanation,
    difficulty: currentDifficulty,
  });
}

// Write to JSON file
const outputPath = path.join(
  __dirname,
  "../src/data/fbla-questions/personal-finance.json"
);
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));

console.log(
  `Successfully converted ${questions.length} questions to JSON format`
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
