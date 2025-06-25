const fs = require("fs");
const path = require("path");

// Read the Business Management questions text file
const businessManagementText = fs.readFileSync(
  "c:/Users/manue/Downloads/Business management.txt",
  "utf8"
);

const questions = [];
const lines = businessManagementText.split("\n");

let currentQuestionText = null;
let currentOptions = {};
let currentCorrectAnswer = null;
let currentExplanation = "";
let currentDifficulty = "Medium";
let questionBuffer = [];

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
      options: currentOptions,
      correctAnswer: currentCorrectAnswer,
      explanation: currentExplanation,
      difficulty: currentDifficulty,
    });
  }
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (!line) continue;

  // Check if this is a new question (starts with a number)
  const questionMatch = line.match(/^(\d+)\.\s+(.+)$/);
  if (questionMatch) {
    // Save previous question if it exists
    flushQuestion();

    // Start new question
    currentQuestionText = questionMatch[2];
    currentOptions = {};
    currentCorrectAnswer = null;
    currentExplanation = "";
    currentDifficulty = "Medium";
    continue;
  }

  // Check for options (A), B), C), D))
  const optionMatch = line.match(/^([A-D])\)\s+(.+)$/);
  if (optionMatch) {
    const optionLetter = optionMatch[1];
    const optionText = optionMatch[2];
    currentOptions[optionLetter] = optionText;
    continue;
  }

  // Check for answer
  if (line.startsWith("Answer:")) {
    currentCorrectAnswer = line.replace("Answer:", "").trim();
    continue;
  }

  // Check for explanation
  if (line.startsWith("Explanation:")) {
    currentExplanation = line.replace("Explanation:", "").trim();
    continue;
  }

  // Check for difficulty
  if (line.startsWith("Difficulty:")) {
    const difficultyText = line.replace("Difficulty:", "").trim();
    if (difficultyText.includes("★")) {
      const starCount = (difficultyText.match(/★/g) || []).length;
      if (starCount === 1) currentDifficulty = "Easy";
      else if (starCount === 2) currentDifficulty = "Medium";
      else if (starCount === 3) currentDifficulty = "Hard";
    }
    continue;
  }

  // If we have a question but no options yet, this might be a continuation of the question
  if (currentQuestionText && Object.keys(currentOptions).length === 0) {
    currentQuestionText += " " + line;
  }
  // If we have options but no answer yet, this might be a continuation of an option
  else if (Object.keys(currentOptions).length > 0 && !currentCorrectAnswer) {
    const lastOption = Object.keys(currentOptions).pop();
    currentOptions[lastOption] += " " + line;
  }
  // If we have an answer but no explanation yet, this might be a continuation of the answer
  else if (currentCorrectAnswer && !currentExplanation) {
    currentCorrectAnswer += " " + line;
  }
  // If we have an explanation but no difficulty yet, this might be a continuation of the explanation
  else if (currentExplanation && currentDifficulty === "Medium") {
    currentExplanation += " " + line;
  }
}

// Don't forget to save the last question
flushQuestion();

// Write to JSON file
const outputPath = path.join(
  __dirname,
  "../src/data/fbla-questions/business-management.json"
);

fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));

console.log(
  `Successfully converted ${questions.length} Business Management questions to JSON`
);
console.log(`Output saved to: ${outputPath}`);

// Log some sample questions for verification
console.log("\nSample questions:");
questions.slice(0, 3).forEach((q, index) => {
  console.log(`\nQuestion ${index + 1}:`);
  console.log(`ID: ${q.id}`);
  console.log(`Question: ${q.question}`);
  console.log(`Options:`, q.options);
  console.log(`Correct Answer: ${q.correctAnswer}`);
  console.log(`Explanation: ${q.explanation}`);
  console.log(`Difficulty: ${q.difficulty}`);
});
