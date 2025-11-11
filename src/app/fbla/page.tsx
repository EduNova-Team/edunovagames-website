"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  BookOpen,
  Clock,
  CheckCircle,
  RotateCcw,
  Timer,
  FileText,
  Calendar,
  BarChart3,
  Flag,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  Play,
} from "lucide-react";
import Link from "next/link";
import {
  fblaQuestions,
  filterQuestionsByDifficulty,
  getQuestionCounts,
  type FBLAQuestion,
} from "@/lib/fbla-questions";
import PDFUploadModal from "@/components/PDFUploadModal";

// Quiz data structure with real Accounting I questions
const quizEvents = [
  {
    id: "accounting-i",
    title: "Accounting I",
    description:
      "Fundamental accounting principles, financial statements, and basic bookkeeping concepts",

    questionCount: 250,
    timeLimit: 60,
    color: "#6366F1",
    icon: "📊",
  },
  {
    id: "personal-finance",
    title: "Personal Finance",
    description:
      "Personal budgeting, investing, insurance, and financial planning concepts",

    questionCount: 50,
    timeLimit: 60,
    color: "#10B981",
    icon: "💰",
  },
  {
    id: "business-management",
    title: "Business Management",
    description:
      "Management principles, leadership, organizational behavior, and strategic planning",
    questionCount: 50,
    timeLimit: 60,
    color: "#22D3EE",
    icon: "👔",
  },
  {
    id: "advertising",
    title: "Advertising",
    description:
      "Marketing mix, consumer behavior, market research, and promotional strategies",
    questionCount: 50,
    timeLimit: 60,
    color: "#FF3B9A",
    icon: "📈",
  },
  {
    id: "marketing",
    title: "Marketing",
    description:
      "Introductory marketing concepts, functions, research, distribution, e-commerce, and ethics",
    questionCount: 125,
    timeLimit: 60,
    color: "#FBBF24",
    icon: "📣",
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity",
    description:
      "Network security, data protection, cyber threats, and security best practices",
    questionCount: 50,
    timeLimit: 60,
    color: "#8B5CF6",
    icon: "🔒",
  },
  {
    id: "securities-investments",
    title: "Securities & Investments",
    description:
      "Competencies in securities, investments, regulation, and financial markets",
    questionCount: 250,
    timeLimit: 50,
    color: "#2563EB",
    icon: "💹",
  },
  {
    id: "introduction-to-it",
    title: "Introduction to IT",
    description:
      "Introductory competencies in information technology: hardware, software, networking, security, and more",
    questionCount: 250,
    timeLimit: 60,
    color: "#F59E42",
    icon: "💻",
  },
  {
    id: "financial-math",
    title: "Financial Math",
    description:
      "Calculations in the business world: consumer credit, payroll, taxes, investments, insurance, and more",
    questionCount: 250,
    timeLimit: 60,
    color: "#10B981",
    icon: "🧮",
  },
  {
    id: "supply-chain",
    title: "Supply Chain Management",
    description:
      "Coordinating the flow of goods, information, and finances from raw materials through production to end customers",
    questionCount: 250,
    timeLimit: 60,
    color: "#8B5CF6",
    icon: "🚚",
  },
  {
    id: "custom",
    title: "Custom",
    description:
      "Upload any FBLA-aligned study PDF to instantly transform it into a personalized practice quiz tailored to your material",
    questionCount: 0,
    timeLimit: 60,
    color: "#EC4899",
    icon: "📝",
  },
];

// Sample quiz history data
const sampleQuizHistory: QuizHistory[] = [];

interface QuizConfig {
  numberOfQuestions: number;
  timeLimit: number;
  difficulty: string;
  mode: "timed" | "unlimited";
}

interface QuizState {
  currentEvent: string | null;
  currentQuestion: number;
  answers: string[];
  score: number;
  timeRemaining: number;
  isComplete: boolean;
  showResults: boolean;
  showReview: boolean;
  config: QuizConfig;
  selectedQuestions: FBLAQuestion[];
  flaggedQuestions: Set<number>;
  showAnswerFeedback: boolean;
  checkedAnswer: string | null;
  showExplanation: boolean;
}

interface QuizHistory {
  id: number;
  eventId: string;
  eventTitle: string;
  date: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: string;
  difficulty: string;
  mode: string;
}

const getQuestionsForEvent = (eventId: string): FBLAQuestion[] => {
  // Check if this is a custom quiz
  if (eventId === "custom") {
    // Load from sessionStorage
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("fbla-custom-questions");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }
  return fblaQuestions[eventId as keyof typeof fblaQuestions] || [];
};

export default function FBLAPage() {
  const [quizState, setQuizState] = useState<QuizState>({
    currentEvent: null,
    currentQuestion: 0,
    answers: [],
    score: 0,
    timeRemaining: 0,
    isComplete: false,
    showResults: false,
    showReview: false,
    config: {
      numberOfQuestions: 10,
      timeLimit: 15,
      difficulty: "Any",
      mode: "timed",
    },
    selectedQuestions: [],
    flaggedQuestions: new Set(),
    showAnswerFeedback: false,
    checkedAnswer: null,
    showExplanation: false,
  });
  const [showConfig, setShowConfig] = useState(false);
  const [tempConfig, setTempConfig] = useState<QuizConfig>({
    numberOfQuestions: 10,
    timeLimit: 15,
    difficulty: "Any",
    mode: "timed",
  });
  const [quizHistory, setQuizHistory] =
    useState<QuizHistory[]>(sampleQuizHistory);
  const [expandedReviewIdx, setExpandedReviewIdx] = useState<number | null>(
    null
  );
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      quizState.currentEvent &&
      quizState.timeRemaining > 0 &&
      !quizState.isComplete &&
      !quizState.showReview &&
      quizState.config.mode === "timed"
    ) {
      interval = setInterval(() => {
        setQuizState((prev) => {
          if (prev.timeRemaining <= 1) {
            finishQuiz(prev);
            return {
              ...prev,
              timeRemaining: 0,
              isComplete: true,
              showResults: true,
            };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [
    quizState.currentEvent,
    quizState.timeRemaining,
    quizState.isComplete,
    quizState.showReview,
    quizState.config.mode,
  ]);

  const startQuiz = (eventId: string, config: QuizConfig) => {
    const event = quizEvents.find((e) => e.id === eventId);
    const allQuestions = getQuestionsForEvent(eventId);

    if (!event || allQuestions.length === 0) return;

    let filteredQuestions = allQuestions;
    if (config.difficulty !== "Any") {
      filteredQuestions = filterQuestionsByDifficulty(
        allQuestions,
        config.difficulty
      );
    }

    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(
      0,
      Math.min(config.numberOfQuestions, filteredQuestions.length)
    );

    setQuizState({
      currentEvent: eventId,
      currentQuestion: 0,
      answers: new Array(selectedQuestions.length).fill(""),
      score: 0,
      timeRemaining: config.mode === "timed" ? config.timeLimit * 60 : 0,
      isComplete: false,
      showResults: false,
      showReview: false,
      config,
      selectedQuestions,
      flaggedQuestions: new Set(),
      showAnswerFeedback: false,
      checkedAnswer: null,
      showExplanation: false,
    });
    setShowConfig(false);
  };

  const selectAnswer = (answer: string) => {
    const newAnswers = [...quizState.answers];
    newAnswers[quizState.currentQuestion] = answer;
    setQuizState((prev) => ({ ...prev, answers: newAnswers }));
  };

  const goToQuestion = (questionIndex: number) => {
    setQuizState((prev) => ({ ...prev, currentQuestion: questionIndex }));
  };

  const toggleFlag = (questionIndex: number) => {
    setQuizState((prev) => {
      const newFlagged = new Set(prev.flaggedQuestions);
      if (newFlagged.has(questionIndex)) {
        newFlagged.delete(questionIndex);
      } else {
        newFlagged.add(questionIndex);
      }
      return { ...prev, flaggedQuestions: newFlagged };
    });
  };

  const nextQuestion = () => {
    if (quizState.currentQuestion < quizState.selectedQuestions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
      }));
    }
  };

  const previousQuestion = () => {
    if (quizState.currentQuestion > 0) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion - 1,
      }));
    }
  };

  const showReviewScreen = () => {
    setQuizState((prev) => ({ ...prev, showReview: true }));
  };

  const finishQuiz = (state: QuizState) => {
    const correctAnswers = state.answers.filter((answer, index) => {
      const question = state.selectedQuestions[index];
      return question && answer === question.correctAnswer;
    }).length;

    const percentage = Math.round(
      (correctAnswers / state.selectedQuestions.length) * 100
    );
    const timeSpent =
      state.config.mode === "timed"
        ? formatTime(state.config.timeLimit * 60 - state.timeRemaining)
        : "N/A";

    const newQuizRecord: QuizHistory = {
      id: Date.now(),
      eventId: state.currentEvent!,
      eventTitle:
        quizEvents.find((e) => e.id === state.currentEvent)?.title || "",
      date: new Date().toISOString().split("T")[0],
      score: correctAnswers,
      totalQuestions: state.selectedQuestions.length,
      percentage,
      timeSpent,
      difficulty: state.config.difficulty,
      mode: state.config.mode,
    };

    setQuizHistory((prev) => [newQuizRecord, ...prev]);

    setQuizState((prev) => ({
      ...prev,
      score: correctAnswers,
      isComplete: true,
      showResults: true,
      showReview: false,
    }));
  };

  const resetQuiz = () => {
    setQuizState({
      currentEvent: null,
      currentQuestion: 0,
      answers: [],
      score: 0,
      timeRemaining: 0,
      isComplete: false,
      showResults: false,
      showReview: false,
      config: {
        numberOfQuestions: 10,
        timeLimit: 15,
        difficulty: "Any",
        mode: "timed",
      },
      selectedQuestions: [],
      flaggedQuestions: new Set(),
      showAnswerFeedback: false,
      checkedAnswer: null,
      showExplanation: false,
    });
    setShowConfig(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPerformanceStats = (eventId: string) => {
    const eventHistory = quizHistory.filter((quiz) => quiz.eventId === eventId);
    if (eventHistory.length === 0) return null;

    const averageScore = Math.round(
      eventHistory.reduce((sum, quiz) => sum + quiz.percentage, 0) /
        eventHistory.length
    );
    const bestScore = Math.max(...eventHistory.map((quiz) => quiz.percentage));
    const totalQuizzes = eventHistory.length;

    return { averageScore, bestScore, totalQuizzes };
  };

  const getQuestionStatus = (index: number) => {
    if (quizState.answers[index]) return "answered";
    if (quizState.flaggedQuestions.has(index)) return "flagged";
    return "unanswered";
  };

  const renderQuestionNavigator = () => {
    const currentEvent = quizEvents.find(
      (e) => e.id === quizState.currentEvent
    );
    if (!currentEvent) return null;

    const answeredCount = quizState.answers.filter((answer) => answer).length;
    const flaggedCount = quizState.flaggedQuestions.size;

    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText
              className="w-5 h-5"
              style={{ color: currentEvent.color }}
            />
            Question Navigator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {answeredCount}
              </div>
              <div className="text-gray-400">Answered</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-400">
                {flaggedCount}
              </div>
              <div className="text-gray-400">Flagged</div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {quizState.selectedQuestions.map((_, index) => {
              const status = getQuestionStatus(index);
              const isCurrent = index === quizState.currentQuestion;

              return (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`
                    w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 relative
                    ${
                      isCurrent
                        ? "ring-2 ring-[#22D3EE] bg-[#22D3EE]/20 text-[#22D3EE]"
                        : status === "answered"
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : status === "flagged"
                        ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }
                  `}
                >
                  {index + 1}
                  {quizState.flaggedQuestions.has(index) && (
                    <Flag className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20"></div>
              <span className="text-gray-400">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/20"></div>
              <span className="text-gray-400">Flagged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/5"></div>
              <span className="text-gray-400">Unanswered</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderReviewScreen = () => {
    const currentEvent = quizEvents.find(
      (e) => e.id === quizState.currentEvent
    );
    if (!currentEvent) return null;

    const answeredCount = quizState.answers.filter((answer) => answer).length;
    const unansweredCount = quizState.selectedQuestions.length - answeredCount;
    const flaggedCount = quizState.flaggedQuestions.size;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-white">
              Review Your Answers
            </CardTitle>
            <p className="text-center text-gray-400">{currentEvent.title}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-green-400">
                  {answeredCount}
                </div>
                <div className="text-sm text-gray-400">Answered</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-400">
                  {unansweredCount}
                </div>
                <div className="text-sm text-gray-400">Unanswered</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-400">
                  {flaggedCount}
                </div>
                <div className="text-sm text-gray-400">Flagged</div>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <div className="font-medium text-red-400">
                    Unanswered Questions
                  </div>
                  <div className="text-sm text-gray-400">
                    You have {unansweredCount} unanswered question
                    {unansweredCount !== 1 ? "s" : ""}. These will be marked as
                    incorrect.
                  </div>
                </div>
              </div>
            )}

            {flaggedCount > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3">
                <Flag className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="font-medium text-yellow-400">
                    Flagged Questions
                  </div>
                  <div className="text-sm text-gray-400">
                    You have {flaggedCount} flagged question
                    {flaggedCount !== 1 ? "s" : ""} for review.
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Question Overview
              </h3>
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {quizState.selectedQuestions.map((question, index) => {
                  const status = getQuestionStatus(index);
                  const answer = quizState.answers[index];

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => {
                        setQuizState((prev) => ({
                          ...prev,
                          showReview: false,
                          currentQuestion: index,
                        }));
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium
                          ${
                            status === "answered"
                              ? "bg-green-500/20 text-green-400"
                              : status === "flagged"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }
                        `}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            Question {index + 1}
                          </div>
                          <div className="text-sm text-gray-400">
                            {answer
                              ? `Answer: ${answer}`
                              : "No answer selected"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {quizState.flaggedQuestions.has(index) && (
                          <Flag className="w-4 h-4 text-yellow-400" />
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Button
                variant="outline"
                onClick={() =>
                  setQuizState((prev) => ({ ...prev, showReview: false }))
                }
                className="border-white/20 hover:bg-white/5"
              >
                Continue Reviewing
              </Button>
              <Button
                onClick={() => finishQuiz(quizState)}
                style={{ backgroundColor: currentEvent.color }}
                className="text-white"
              >
                Submit Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderQuizConfig = (eventId: string) => {
    const event = quizEvents.find((e) => e.id === eventId);
    const availableQuestions = getQuestionsForEvent(eventId);
    const performanceStats = getPerformanceStats(eventId);

    if (!event || availableQuestions.length === 0) {
      return (
        <div className="text-center py-20">
          <h3 className="text-2xl font-bold mb-4">Questions Coming Soon!</h3>
          <p className="text-gray-400 mb-6">
            We're preparing high-quality practice questions for {event?.title}.
            Check back soon!
          </p>
          <Button onClick={() => setShowConfig(false)}>
            Back to Quiz Selection
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="grid lg:grid-[2fr,1fr] gap-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-white">
                Test Configuration
              </CardTitle>
              <p className="text-center text-gray-400">{event.title}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="questions" className="text-white">
                    Number of Questions
                  </Label>
                  <Input
                    id="questions"
                    type="number"
                    min="1"
                    max={availableQuestions.length}
                    value={tempConfig.numberOfQuestions}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        numberOfQuestions: Math.min(
                          Number.parseInt(e.target.value) || 1,
                          availableQuestions.length
                        ),
                      }))
                    }
                    className="bg-white/5 border-white/10 text-white text-center text-2xl h-16"
                  />
                  <p className="text-sm text-gray-400 text-center">
                    Available: {availableQuestions.length} questions
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-white">
                    Time Limit (minutes)
                  </Label>
                  <Input
                    id="time"
                    type="number"
                    min="1"
                    max="180"
                    value={tempConfig.timeLimit}
                    onChange={(e) =>
                      setTempConfig((prev) => ({
                        ...prev,
                        timeLimit: Number.parseInt(e.target.value) || 15,
                      }))
                    }
                    className="bg-white/5 border-white/10 text-white text-center text-2xl h-16"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-white">
                    Difficulty
                  </Label>
                  <Select
                    value={tempConfig.difficulty}
                    onValueChange={(value) =>
                      setTempConfig((prev) => ({ ...prev, difficulty: value }))
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any">Any</SelectItem>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 pt-4">
                  <Button
                    className="w-full h-12 text-lg"
                    style={{ backgroundColor: event.color }}
                    onClick={() =>
                      startQuiz(eventId, { ...tempConfig, mode: "timed" })
                    }
                  >
                    <Timer className="w-5 h-5 mr-2" />
                    Generate Test
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 text-lg border-white/20 hover:bg-gray-200 hover:text-gray-900 disabled:bg-gray-200 disabled:text-gray-400"
                    onClick={() =>
                      startQuiz(eventId, { ...tempConfig, mode: "unlimited" })
                    }
                    disabled={availableQuestions.length === 0}
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Unlimited Practice
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => setShowConfig(false)}
                className="w-full bg-gray-200 text-gray-900 hover:bg-gray-300"
              >
                Back to Quiz Selection
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {performanceStats && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3
                      className="w-5 h-5"
                      style={{ color: event.color }}
                    />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="text-center">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: event.color }}
                      >
                        {performanceStats.averageScore}%
                      </div>
                      <div className="text-sm text-gray-400">Average Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {performanceStats.bestScore}%
                      </div>
                      <div className="text-sm text-gray-400">Best Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#22D3EE]">
                        {performanceStats.totalQuizzes}
                      </div>
                      <div className="text-sm text-gray-400">Quizzes Taken</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5" style={{ color: event.color }} />
                  Recent Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {quizHistory
                    .filter((quiz) => quiz.eventId === eventId)
                    .slice(0, 5)
                    .map((quiz) => (
                      <div
                        key={quiz.id}
                        className="bg-white/5 rounded-lg p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">
                            {formatDate(quiz.date)}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{
                              color:
                                quiz.percentage >= 80
                                  ? "#10B981"
                                  : quiz.percentage >= 60
                                  ? "#F59E0B"
                                  : "#EF4444",
                            }}
                          >
                            {quiz.percentage}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>
                            {quiz.score}/{quiz.totalQuestions} correct
                          </span>
                          <span>{quiz.difficulty}</span>
                        </div>
                        {quiz.mode === "timed" && (
                          <div className="text-xs text-gray-400">
                            Time: {quiz.timeSpent}
                          </div>
                        )}
                      </div>
                    ))}
                  {quizHistory.filter((quiz) => quiz.eventId === eventId)
                    .length === 0 && (
                    <div className="text-center text-gray-400 py-4">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No quiz history yet</p>
                      <p className="text-xs">
                        Take your first quiz to see your progress!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderQuizSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Practice Quizzes
        </h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Questions Are Based on Updated 2025 Guidelines!
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizEvents.map((event, index) => {
          const availableQuestions = getQuestionsForEvent(event.id);
          const isAvailable = availableQuestions.length > 0;
          const performanceStats = getPerformanceStats(event.id);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 h-full ${
                  !isAvailable ? "opacity-60" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${event.color}20` }}
                    >
                      {event.icon}
                    </div>
                    <div>
                      <CardTitle className="text-white">
                        {event.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${event.color}20`,
                            color: event.color,
                          }}
                        ></span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">{event.description}</p>

                  {performanceStats && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Best Score:</span>
                        <span className="font-bold text-green-400">
                          {performanceStats.bestScore}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Attempts:</span>
                        <span className="font-bold text-[#22D3EE]">
                          {performanceStats.totalQuizzes}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>
                        {isAvailable
                          ? availableQuestions.length
                          : event.questionCount}{" "}
                        Questions
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Customizable</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full"
                      style={{ backgroundColor: event.color }}
                      onClick={() => {
                        // Special handling for custom quiz
                        if (event.id === "custom") {
                          // Check if we have custom questions in session
                          const customQuestions =
                            typeof window !== "undefined"
                              ? sessionStorage.getItem("fbla-custom-questions")
                              : null;
                          if (customQuestions) {
                            // If questions exist, proceed to quiz config
                            setShowConfig(true);
                            setQuizState((prev) => ({
                              ...prev,
                              currentEvent: "custom",
                            }));
                            const parsedQuestions = JSON.parse(customQuestions);
                            setTempConfig({
                              numberOfQuestions: Math.min(
                                10,
                                parsedQuestions.length
                              ),
                              timeLimit: 15,
                              difficulty: "Any",
                              mode: "timed",
                            });
                          } else {
                            // If no questions, show upload modal
                            setShowUploadModal(true);
                          }
                        } else if (isAvailable) {
                          // Normal flow for other quizzes
                          setShowConfig(true);
                          setQuizState((prev) => ({
                            ...prev,
                            currentEvent: event.id,
                          }));
                          setTempConfig({
                            numberOfQuestions: Math.min(
                              10,
                              availableQuestions.length
                            ),
                            timeLimit: 15,
                            difficulty: "Any",
                            mode: "timed",
                          });
                        }
                      }}
                      disabled={event.id !== "custom" && !isAvailable}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {event.id === "custom"
                        ? "Upload PDF"
                        : isAvailable
                        ? "Play"
                        : "Coming Soon"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderQuiz = () => {
    const currentEvent = quizEvents.find(
      (e) => e.id === quizState.currentEvent
    );
    const currentQuestionData =
      quizState.selectedQuestions[quizState.currentQuestion];

    if (!currentEvent || !currentQuestionData) {
      return (
        <div className="text-center py-20">
          <h3 className="text-2xl font-bold mb-4">Loading Quiz...</h3>
          <Button onClick={resetQuiz}>Back to Quiz Selection</Button>
        </div>
      );
    }

    if (quizState.showReview) {
      return renderReviewScreen();
    }

    if (quizState.showResults) {
      const percentage = Math.round(
        (quizState.score / quizState.selectedQuestions.length) * 100
      );
      return (
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-[#6366F1] to-[#22D3EE] flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold">Quiz Complete!</h2>
            <div
              className="text-6xl font-bold"
              style={{ color: currentEvent.color }}
            >
              {percentage}%
            </div>
            <p className="text-xl text-gray-400">
              You scored {quizState.score} out of{" "}
              {quizState.selectedQuestions.length} questions correctly
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-bold">Performance Breakdown</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {quizState.score}
                </div>
                <div className="text-sm text-gray-400">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {quizState.selectedQuestions.length - quizState.score}
                </div>
                <div className="text-sm text-gray-400">Incorrect</div>
              </div>
            </div>
            {quizState.config.mode === "timed" && (
              <div className="text-center pt-2">
                <div className="text-sm text-gray-400">
                  Time:{" "}
                  {formatTime(
                    quizState.config.timeLimit * 60 - quizState.timeRemaining
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Review Section */}
          <div className="bg-white/5 rounded-xl p-6 space-y-6 mt-6">
            <h3 className="text-xl font-bold text-left">Question Review</h3>
            <div className="space-y-6 max-h-[400px] overflow-y-auto">
              {quizState.selectedQuestions.map((question, idx) => {
                const userAnswer = quizState.answers[idx];
                const isCorrect = userAnswer === question.correctAnswer;
                const isExpanded = expandedReviewIdx === idx;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-white/10 bg-white/10"
                  >
                    <button
                      className="w-full flex items-center justify-between focus:outline-none"
                      onClick={() =>
                        setExpandedReviewIdx(isExpanded ? null : idx)
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-lg ${
                            isCorrect ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {isCorrect ? "Correct" : "Incorrect"}
                        </span>
                        <span className="text-gray-400">
                          Question {idx + 1}
                        </span>
                      </div>
                      <span className="text-white text-xl">
                        {isExpanded ? "−" : "+"}
                      </span>
                    </button>
                    <div className="text-white font-medium mb-2 mt-2">
                      {question.question}
                    </div>
                    {isExpanded && (
                      <>
                        <div className="mb-2">
                          <span className="font-semibold text-gray-300">
                            Your answer:{" "}
                          </span>
                          <span
                            className={
                              isCorrect ? "text-green-400" : "text-red-400"
                            }
                          >
                            {userAnswer
                              ? `${userAnswer}. ${
                                  question.options[
                                    userAnswer as keyof typeof question.options
                                  ]
                                }`
                              : "No answer"}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div className="mb-2">
                            <span className="font-semibold text-gray-300">
                              Correct answer:{" "}
                            </span>
                            <span className="text-green-400">
                              {question.correctAnswer}.{" "}
                              {
                                question.options[
                                  question.correctAnswer as keyof typeof question.options
                                ]
                              }
                            </span>
                          </div>
                        )}
                        {question.explanation && (
                          <div className="mt-2 text-blue-200 bg-blue-500/10 border border-blue-500/20 rounded p-3">
                            <span className="font-semibold text-blue-400">
                              Explanation:{" "}
                            </span>
                            {question.explanation}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                setShowConfig(true);
                setTempConfig(quizState.config);
              }}
              variant="outline"
              className="text-black"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
            <Button onClick={resetQuiz}>Back to Quizzes</Button>
          </div>
        </div>
      );
    }

    const checkAnswer = () => {
      const currentAnswer = quizState.answers[quizState.currentQuestion];
      if (currentAnswer) {
        setQuizState((prev) => ({
          ...prev,
          showAnswerFeedback: true,
          checkedAnswer: currentAnswer,
        }));
      }
    };

    const nextQuestionUnlimited = () => {
      if (quizState.currentQuestion < quizState.selectedQuestions.length - 1) {
        setQuizState((prev) => ({
          ...prev,
          currentQuestion: prev.currentQuestion + 1,
          showAnswerFeedback: false,
          checkedAnswer: null,
          showExplanation: false,
        }));
      } else {
        // End of quiz in unlimited mode
        finishQuiz(quizState);
      }
    };

    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {currentEvent.title}
                </h2>
                <p className="text-gray-300">
                  Question {quizState.currentQuestion + 1} of{" "}
                  {quizState.selectedQuestions.length}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {quizState.config.mode === "timed" &&
                  quizState.timeRemaining > 0 && (
                    <div className="flex items-center gap-2 text-[#22D3EE]">
                      <Clock className="w-5 h-5" />
                      <span className="font-mono text-lg">
                        {formatTime(quizState.timeRemaining)}
                      </span>
                    </div>
                  )}
                <Button
                  variant="ghost"
                  onClick={resetQuiz}
                  className="text-white hover:text-gray-300"
                >
                  Exit Quiz
                </Button>
              </div>
            </div>

            <Progress
              value={
                (quizState.currentQuestion /
                  quizState.selectedQuestions.length) *
                100
              }
              className="h-2"
            />

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-semibold flex-1 text-white">
                    {currentQuestionData.question}
                  </h3>
                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `${currentEvent.color}20`,
                        color: currentEvent.color,
                      }}
                    >
                      {currentQuestionData.difficulty}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFlag(quizState.currentQuestion)}
                      className={`p-2 ${
                        quizState.flaggedQuestions.has(
                          quizState.currentQuestion
                        )
                          ? "text-yellow-400 hover:text-yellow-300"
                          : "text-gray-400 hover:text-yellow-400"
                      }`}
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(currentQuestionData.options).map(
                    ([key, option]) => {
                      const isSelected =
                        quizState.answers[quizState.currentQuestion] === key;
                      const isCorrect =
                        key === currentQuestionData.correctAnswer;
                      const isChecked = quizState.showAnswerFeedback;
                      const userAnswer = quizState.checkedAnswer;

                      let optionStyle =
                        "border-white/10 hover:border-white/20 bg-white/5";

                      if (isChecked) {
                        if (isCorrect) {
                          optionStyle = "border-green-500 bg-green-500/20";
                        } else if (isSelected && !isCorrect) {
                          optionStyle = "border-red-500 bg-red-500/20";
                        } else {
                          optionStyle = "border-white/10 bg-white/5";
                        }
                      } else if (isSelected) {
                        optionStyle = "border-[#22D3EE] bg-[#22D3EE]/10";
                      }

                      return (
                        <button
                          key={key}
                          onClick={() => !isChecked && selectAnswer(key)}
                          disabled={isChecked}
                          className={`w-full p-4 text-left rounded-lg border transition-all duration-200 ${optionStyle} ${
                            isChecked ? "cursor-default" : "cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                isChecked && isCorrect
                                  ? "border-green-500 bg-green-500"
                                  : isChecked && isSelected && !isCorrect
                                  ? "border-red-500 bg-red-500"
                                  : isSelected
                                  ? "border-[#22D3EE] bg-[#22D3EE]"
                                  : "border-gray-400"
                              }`}
                            >
                              {(isSelected || (isChecked && isCorrect)) && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className="text-white">
                              {key}. {String(option)}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                {quizState.config.mode === "unlimited" &&
                  quizState.showAnswerFeedback && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        {quizState.checkedAnswer ===
                        currentQuestionData.correctAnswer ? (
                          <div className="text-green-400 font-bold">
                            Correct!
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-red-400 font-bold">Wrong!</div>
                            <div className="text-white">
                              <span className="font-medium">
                                Correct Answer:
                              </span>{" "}
                              {currentQuestionData.correctAnswer}.{" "}
                              {
                                currentQuestionData.options[
                                  currentQuestionData.correctAnswer as keyof typeof currentQuestionData.options
                                ]
                              }
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() =>
                          setQuizState((prev) => ({
                            ...prev,
                            showExplanation: !prev.showExplanation,
                          }))
                        }
                        className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Explain
                      </Button>

                      {quizState.showExplanation && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                          <p className="text-blue-100">
                            {currentQuestionData.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    onClick={previousQuestion}
                    disabled={quizState.currentQuestion === 0}
                    className="border-white/20 hover:bg-white/5"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {quizState.config.mode === "unlimited" ? (
                      quizState.showAnswerFeedback ? (
                        quizState.currentQuestion ===
                        quizState.selectedQuestions.length - 1 ? (
                          <Button
                            onClick={() => finishQuiz(quizState)}
                            style={{ backgroundColor: currentEvent.color }}
                            className="text-white"
                          >
                            Finish Quiz
                          </Button>
                        ) : (
                          <Button
                            onClick={nextQuestionUnlimited}
                            style={{ backgroundColor: currentEvent.color }}
                            className="text-white"
                          >
                            Next Question
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        )
                      ) : (
                        <Button
                          onClick={checkAnswer}
                          disabled={
                            !quizState.answers[quizState.currentQuestion]
                          }
                          style={{ backgroundColor: currentEvent.color }}
                          className="text-white disabled:opacity-50"
                        >
                          Check Answer
                        </Button>
                      )
                    ) : // Timed mode buttons (existing logic)
                    quizState.currentQuestion ===
                      quizState.selectedQuestions.length - 1 ? (
                      <Button
                        onClick={showReviewScreen}
                        style={{ backgroundColor: currentEvent.color }}
                        className="text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review & Submit
                      </Button>
                    ) : (
                      <Button
                        onClick={nextQuestion}
                        style={{ backgroundColor: currentEvent.color }}
                        className="text-white"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">{renderQuestionNavigator()}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A16]">
      <Header />

      <main className="pt-24 pb-32">
        <div className="container mx-auto px-4">
          {!quizState.currentEvent && !showConfig ? (
            <>
              <section className="py-20 relative overflow-hidden">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center mb-16"
                >
                  <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5 mb-6">
                    <span className="text-sm font-mono text-[#22D3EE]">
                      Future Business Leaders of America
                    </span>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#6366F1] via-[#22D3EE] to-[#FF3B9A] text-transparent bg-clip-text">
                    FBLA Competition Prep
                  </h1>
                  <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                    Succeed in state and national competitions.
                  </p>
                </motion.div>
              </section>

              <section className="py-8">{renderQuizSelection()}</section>

              <section className="py-20">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center bg-gradient-to-r from-[#6366F1]/20 via-[#22D3EE]/20 to-[#FF3B9A]/20 rounded-2xl p-12"
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Ready to Dominate FBLA Competitions?
                  </h2>
                  <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                    Join hundreds of students who have improved their FBLA
                    performance with our AI-powered training platform
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/#contact" scroll={false}>
                      <Button
                        variant="outline"
                        className="border-[#22D3EE] text-[#22D3EE] hover:bg-[#22D3EE]/10 px-8 h-12 text-lg rounded-full"
                      >
                        Contact Us
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </section>
            </>
          ) : (
            <section className="py-8">
              {showConfig && quizState.currentEvent
                ? renderQuizConfig(quizState.currentEvent)
                : quizState.currentEvent
                ? renderQuiz()
                : renderQuizSelection()}
            </section>
          )}
        </div>
      </main>

      <Footer />

      {/* PDF Upload Modal for Custom Quiz */}
      <PDFUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(questions) => {
          // Questions are already stored in sessionStorage by the modal
          // Now proceed to quiz config
          setShowConfig(true);
          setQuizState((prev) => ({
            ...prev,
            currentEvent: "custom",
          }));
          setTempConfig({
            numberOfQuestions: Math.min(10, questions.length),
            timeLimit: 15,
            difficulty: "Any",
            mode: "timed",
          });
        }}
      />
    </div>
  );
}
