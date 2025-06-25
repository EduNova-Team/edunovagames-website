const fs = require("fs");
const path = require("path");

// Read the existing personal finance questions
const existingQuestionsPath = path.join(
  __dirname,
  "../src/data/fbla-questions/personal-finance.json"
);
const existingQuestions = JSON.parse(
  fs.readFileSync(existingQuestionsPath, "utf8")
);

// Additional questions to add
const additionalQuestions = [
  {
    id: 233,
    question:
      "When comparing two brands of the same appliance, the best strategy is to:",
    options: {
      A: "Choose the cheapest option without considering features",
      B: "Compare total cost of ownership, including energy and maintenance",
      C: "Buy the most advertised brand",
      D: "Always choose the one with the longest warranty",
    },
    correctAnswer: "B",
    explanation:
      "Total cost of ownership accounts for purchase price, operating costs, and expected upkeep.",
    difficulty: "Medium",
  },
  {
    id: 234,
    question: "The Magnuson-Moss Warranty Act requires that:",
    options: {
      A: "All warranties must be free",
      B: "Warranty terms be clearly stated and not misleading",
      C: "Warranties last at least two years",
      D: "Consumers waive their rights if they pay for an extended warranty",
    },
    correctAnswer: "B",
    explanation:
      "The Act ensures full disclosure of warranty terms and prohibits deceptive practices.",
    difficulty: "Medium",
  },
  {
    id: 235,
    question: 'A "lemon law" applies to:',
    options: {
      A: "Consumer credit agreements",
      B: "Defective new motor vehicles that cannot be repaired",
      C: "Purchases made at farmer's markets",
      D: 'Used goods sold "as is"',
    },
    correctAnswer: "B",
    explanation:
      "Lemon laws protect buyers of new vehicles with recurring defects that impair use.",
    difficulty: "Medium",
  },
  {
    id: 236,
    question:
      "When renting an apartment, a key element of the lease to review is:",
    options: {
      A: "Lease term and renewal options",
      B: "The property manager's name",
      C: "Number of parking spaces only",
      D: "Distance to the nearest grocery store",
    },
    correctAnswer: "A",
    explanation:
      "Lease term, renewal, and termination clauses determine your obligations and flexibility.",
    difficulty: "Medium",
  },
  {
    id: 237,
    question:
      "A good rule of thumb for housing affordability is to spend no more than:",
    options: {
      A: "10% of gross income on housing",
      B: "25% of net income on housing",
      C: "30% of gross income on housing",
      D: "40% of gross income on housing",
    },
    correctAnswer: "C",
    explanation:
      "Keeping housing costs at or below 30% of gross income helps maintain financial balance.",
    difficulty: "Medium",
  },
  {
    id: 238,
    question: 'When buying a car, the "sticker price" is:',
    options: {
      A: "The negotiated purchase price",
      B: "The manufacturer's suggested retail price before discounts",
      C: "The financing interest rate",
      D: "The trade-in value of your old car",
    },
    correctAnswer: "B",
    explanation:
      "The sticker (MSRP) shows the list price; the actual sale price can be negotiated lower.",
    difficulty: "Medium",
  },
  {
    id: 239,
    question: "A Vehicle Identification Number (VIN) check helps reveal:",
    options: {
      A: "Fuel efficiency ratings",
      B: "Accident history and title issues",
      C: "Dealer's cost for the vehicle",
      D: "Manufacturer's warranty length",
    },
    correctAnswer: "B",
    explanation:
      "VIN reports include past accidents, odometer readings, and title problems.",
    difficulty: "Hard",
  },
  {
    id: 240,
    question: "Using a debit card for purchases means:",
    options: {
      A: "You borrow funds from the bank",
      B: "Funds are withdrawn directly from your checking account",
      C: "You pay interest on the transaction",
      D: "It always offers the best fraud protection",
    },
    correctAnswer: "B",
    explanation:
      "Debit cards draw on existing account balances rather than credit lines.",
    difficulty: "Easy",
  },
  {
    id: 241,
    question: "A secured loan for a big purchase generally:",
    options: {
      A: "Has a higher interest rate than unsecured loans",
      B: "Requires no collateral",
      C: "Requires collateral such as the purchased item",
      D: "Is only available to corporations",
    },
    correctAnswer: "C",
    explanation:
      "Secured loans use the asset (e.g., car, home) as collateral, lowering lender risk.",
    difficulty: "Medium",
  },
  {
    id: 242,
    question: "The APR on a loan includes:",
    options: {
      A: "Only the stated interest rate",
      B: "Interest plus certain fees and charges",
      C: "Late payment penalties only",
      D: "Only application fees",
    },
    correctAnswer: "B",
    explanation:
      "APR reflects the true annual cost by combining interest rate with mandatory fees.",
    difficulty: "Medium",
  },
  {
    id: 243,
    question: "A hallmark of a reputable online seller is:",
    options: {
      A: "No return policy",
      B: "Clear contact information and secure checkout",
      C: "Extremely low prices on all items",
      D: "Unsolicited marketing emails",
    },
    correctAnswer: "B",
    explanation:
      "Legitimate sites provide customer service contacts and use HTTPS to protect data.",
    difficulty: "Medium",
  },
  {
    id: 244,
    question: "Mobile payment apps (e.g., Apple Pay) add security by:",
    options: {
      A: "Sharing your card number with merchants",
      B: "Tokenizing payment information so card details aren't exposed",
      C: "Charging additional fees for each transaction",
      D: "Replacing two-factor authentication",
    },
    correctAnswer: "B",
    explanation:
      "Tokenization replaces sensitive data with one-time codes, reducing fraud risk.",
    difficulty: "Hard",
  },
  {
    id: 245,
    question: "When shopping in-store, using a price-matching policy means:",
    options: {
      A: "The store will match a lower advertised price at purchase",
      B: "You must pay a fee to match prices",
      C: "Only loyalty members qualify",
      D: "It applies only to electronics",
    },
    correctAnswer: "A",
    explanation:
      "Price matching ensures customers get the best available advertised price.",
    difficulty: "Medium",
  },
  {
    id: 246,
    question: "An implied warranty of merchantability means:",
    options: {
      A: "No warranty is provided",
      B: "The product will work as generally expected for its type",
      C: "Only written warranties apply",
      D: "The seller guarantees a money-back return anytime",
    },
    correctAnswer: "B",
    explanation:
      "Implied warranties ensure basic functionality even if no explicit warranty exists.",
    difficulty: "Medium",
  },
  {
    id: 247,
    question: "Before returning a defective product, you should first:",
    options: {
      A: "Re-sell it online",
      B: "Contact the seller or manufacturer per their return policy",
      C: "Discard the packaging",
      D: "File a complaint with the BBB",
    },
    correctAnswer: "B",
    explanation:
      "Following the prescribed return/refund process increases chances of a successful resolution.",
    difficulty: "Easy",
  },
  {
    id: 248,
    question: "Extended service plans on electronics often:",
    options: {
      A: "Cover accidental damage without limit",
      B: "Duplicate manufacturer warranties and may be unnecessary",
      C: "Always provide nationwide coverage",
      D: "Are free with purchase",
    },
    correctAnswer: "B",
    explanation:
      "Many extended plans overlap existing warranties; evaluate true value before buying.",
    difficulty: "Hard",
  },
  {
    id: 249,
    question: "To avoid unwanted subscription renewals, you should:",
    options: {
      A: "Use a single password for all accounts",
      B: "Set calendar reminders to cancel before renewal",
      C: "Provide incomplete payment information",
      D: "Ignore renewal notices",
    },
    correctAnswer: "B",
    explanation:
      "Reminders help you proactively decide whether to continue service.",
    difficulty: "Medium",
  },
  {
    id: 250,
    question: 'A "freemium" model means:',
    options: {
      A: "You pay full price upfront",
      B: "Basic service is free with paid premium upgrades",
      C: "The cheapest service tier is always the best",
      D: "You must provide your credit report to access service",
    },
    correctAnswer: "B",
    explanation:
      "Freemium lets users access core features free, charging for advanced functionality.",
    difficulty: "Medium",
  },
];

// Filter out any existing questions that might have issues (empty options, etc.)
const validExistingQuestions = existingQuestions.filter(
  (q) =>
    q.options &&
    Object.keys(q.options).length > 0 &&
    q.question &&
    q.correctAnswer &&
    q.explanation
);

// Combine existing valid questions with new questions
const allQuestions = [...validExistingQuestions, ...additionalQuestions];

// Write the updated questions back to the file
fs.writeFileSync(existingQuestionsPath, JSON.stringify(allQuestions, null, 2));

console.log(`Successfully updated personal finance questions.`);
console.log(`Total questions: ${allQuestions.length}`);
console.log(`Valid existing questions: ${validExistingQuestions.length}`);
console.log(`New questions added: ${additionalQuestions.length}`);

// Log difficulty distribution
const difficultyCounts = allQuestions.reduce((acc, q) => {
  acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
  return acc;
}, {});

console.log("\nDifficulty distribution:");
Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
  console.log(`${difficulty}: ${count} questions`);
});
