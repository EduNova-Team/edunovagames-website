import accountingQuestions from "@/data/fbla-questions/accounting-i.json";
import personalFinanceQuestions from "@/data/fbla-questions/personal-finance.json";
import businessManagementQuestions from "@/data/fbla-questions/business-management.json";
import advertisingQuestions from "@/data/fbla-questions/advertising.json";
import cybersecurityQuestions from "@/data/fbla-questions/cybersecurity.json";
import introITQuestions from "@/data/fbla-questions/intro-it.json";
import financialMathQuestions from "@/data/fbla-questions/financial-math.json";
import marketingQuestions from "@/data/fbla-questions/marketing.json";
import secInvQuestions from "@/data/fbla-questions/sec-inv.json";
import supplyChainQuestions from "@/data/fbla-questions/supply-chain.json";

export interface FBLAQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export const fblaQuestions = {
  "accounting-i": accountingQuestions as FBLAQuestion[],
  "personal-finance": personalFinanceQuestions as FBLAQuestion[],
  "business-management": businessManagementQuestions as FBLAQuestion[],
  advertising: advertisingQuestions as FBLAQuestion[],
  cybersecurity: cybersecurityQuestions as FBLAQuestion[],
  "introduction-to-it": introITQuestions as FBLAQuestion[],
  "financial-math": financialMathQuestions as FBLAQuestion[],
  marketing: marketingQuestions as FBLAQuestion[],
  "securities-investments": secInvQuestions as FBLAQuestion[],
  "supply-chain": supplyChainQuestions as FBLAQuestion[],
  custom: [] as FBLAQuestion[],
} as const;

export async function getQuestionsForEvent(
  eventId: string
): Promise<FBLAQuestion[]> {
  try {
    const questions = fblaQuestions[eventId as keyof typeof fblaQuestions];
    return questions || [];
  } catch (error) {
    console.error(`Failed to load questions for ${eventId}:`, error);
    return [];
  }
}

export function filterQuestionsByDifficulty(
  questions: FBLAQuestion[],
  difficulty: string
): FBLAQuestion[] {
  if (difficulty === "Any") return questions;
  return questions.filter(
    (q) => q.difficulty.toLowerCase() === difficulty.toLowerCase()
  );
}

export function getQuestionCounts(eventId: string) {
  const questions = fblaQuestions[eventId as keyof typeof fblaQuestions] || [];
  const difficultyCounts = questions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: questions.length,
    easy: difficultyCounts["Easy"] || 0,
    medium: difficultyCounts["Medium"] || 0,
    hard: difficultyCounts["Hard"] || 0,
  };
}

export function getAvailableEvents() {
  return Object.entries(fblaQuestions)
    .filter(([_, questions]) => questions.length > 0)
    .map(([eventId, questions]) => ({
      eventId,
      questionCount: questions.length,
      ...getQuestionCounts(eventId),
    }));
}
