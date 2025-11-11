import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// @ts-ignore - pdf-parse v1.1.1 has typing issues but works at runtime
import pdfParse from "pdf-parse";

// Interface for the extracted question
interface Question {
  id: string;
  questionNumber: number;
  text: string;
  options: {
    id: string;
    label: string; // A, B, C, D
    text: string;
  }[];
  correctAnswer: string; // A, B, C, D
  explanation: string;
}

// PDF data structure
interface PDFData {
  text: string;
  numpages: number;
  pages?: { text?: string }[];
}

// In-memory storage for custom quizzes (in a production app, use a database)
const customQuizzesStorage = new Map<
  string,
  {
    id: string;
    name: string;
    questions: Question[];
    createdAt: Date;
  }
>();

// 🔧 PARSING MODE SWITCH: Toggle between DECA and FBLA parsing strategies
type ParsingMode = "DECA" | "FBLA";
const PARSING_MODE: ParsingMode = "DECA"; // Change to "FBLA" for FBLA-specific parsing

export async function POST(request: NextRequest) {
  console.log("========== PDF PROCESSING START ==========");
  try {
    console.log("Step 1: Parsing FormData...");
    const formData = await request.formData();
    
    console.log("Step 2: Extracting PDF file from FormData...");
    const pdfFile = formData.get("pdf") as File;
    const requestedQuestionCount = parseInt(
      (formData.get("questionCount") as string) || "10",
      10
    );

    if (!pdfFile) {
      console.error("ERROR: No PDF file found in FormData");
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    console.log(
      `Step 3: PDF file received - Name: ${pdfFile.name}, Size: ${pdfFile.size} bytes, Type: ${pdfFile.type}, Mode: ${PARSING_MODE}`
    );

    // Validate file type
    if (pdfFile.type !== "application/pdf" && !pdfFile.name.endsWith(".pdf")) {
      console.error(`ERROR: Invalid file type - ${pdfFile.type}`);
      return NextResponse.json(
        { error: `Invalid file type: ${pdfFile.type}. Expected application/pdf` },
        { status: 400 }
      );
    }

    console.log("Step 4: Converting file to buffer...");
    const buffer = await pdfFile.arrayBuffer();
    console.log(`Buffer created - Size: ${buffer.byteLength} bytes`);

    console.log("Step 5: Parsing PDF with pdf-parse...");
    let pdfData: PDFData;
    try {
      pdfData = (await pdfParse(Buffer.from(buffer))) as PDFData;
      console.log(
        `✓ PDF parsed successfully - Pages: ${pdfData.numpages}, Text length: ${pdfData.text.length} characters`
      );
      
      // Log first 500 characters of extracted text for debugging
      console.log("First 500 chars of extracted text:");
      console.log(pdfData.text.substring(0, 500));
    } catch (pdfError) {
      console.error("ERROR parsing PDF:", pdfError);
      return NextResponse.json(
        { 
          error: "Failed to parse PDF file. The file may be corrupted or password-protected.",
          details: pdfError instanceof Error ? pdfError.message : String(pdfError)
        },
        { status: 500 }
      );
    }

    console.log("Step 6: Extracting questions from parsed PDF...");
    const extractedQuestions = await extractQuestionsFromPDF(
      pdfData,
      requestedQuestionCount,
      PARSING_MODE
    );

    console.log(`✓ Questions extraction complete - Found: ${extractedQuestions.length} questions`);

    console.log("Step 7: Creating quiz metadata...");
    const quizId = uuidv4();
    const quizName =
      pdfFile.name.replace(/\.(pdf|PDF)$/i, "").trim() || "FBLA Custom Quiz";
    
    console.log(`Quiz ID: ${quizId}, Name: ${quizName}`);

    console.log("Step 8: Storing quiz in memory...");
    const quizData = {
      id: quizId,
      name: quizName,
      questions: extractedQuestions,
      createdAt: new Date(),
    };

    customQuizzesStorage.set(quizId, quizData);
    console.log(`✓ Quiz stored successfully`);

    console.log("Step 9: Preparing response...");
    const response = {
      quizId,
      name: quizName,
      questionCount: extractedQuestions.length,
      questions: extractedQuestions,
    };
    
    console.log("========== PDF PROCESSING SUCCESS ==========");
    console.log(`Total questions returned: ${extractedQuestions.length}`);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("========== PDF PROCESSING FAILED ==========");
    console.error("FATAL ERROR:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return NextResponse.json(
      { 
        error: "Failed to process PDF",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Get a specific custom quiz by ID
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const quizId = url.searchParams.get("quizId");

    if (!quizId) {
      return NextResponse.json(
        { error: "Quiz ID is required" },
        { status: 400 }
      );
    }

    const quizData = customQuizzesStorage.get(quizId);

    if (!quizData) {
      console.log(`Custom quiz not found: ${quizId}`);
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    console.log(
      `Returning custom quiz: ${quizId}, Questions: ${quizData.questions.length}`
    );
    return NextResponse.json(quizData);
  } catch (error) {
    console.error("Error retrieving custom quiz:", error);
    return NextResponse.json(
      { error: "Failed to retrieve quiz" },
      { status: 500 }
    );
  }
}

async function extractQuestionsFromPDF(
  pdfData: PDFData,
  requestedCount: number,
  mode: ParsingMode = "DECA"
): Promise<Question[]> {
  console.log(
    `Extracting questions from PDF with ${pdfData.numpages} pages using ${mode} mode...`
  );

  // Step 1: Preprocess the PDF text to improve quality
  const preprocessedText = pdfData.text
    .replace(/(\r\n|\r|\n){2,}/g, "\n\n") // Normalize line breaks
    .replace(/([a-z])\.([A-Z])/g, "$1. $2"); // Fix periods missing spaces

  // Step 2: Split the text into pages for better analysis
  const pages = splitTextIntoPages(pdfData);
  console.log(`Split PDF into ${pages.length} pages`);

  // Step 3: Try to find the key page that contains answers
  const keyPageIndex = findKeyPageIndex(pages, mode);
  console.log(`Key page index: ${keyPageIndex}`);

  // Step 4: Extract questions and options using various methods in order of reliability
  console.log("Starting question extraction...");

  // First attempt: Standard method
  let extractedQuestions = extractQuestionsAndOptions(preprocessedText);
  console.log(
    `Standard extraction found ${extractedQuestions.length} questions`
  );

  // Second attempt if not enough questions: Alternative method
  if (extractedQuestions.length < requestedCount) {
    console.log("Trying alternative extraction method...");
    const alternativeQuestions = extractQuestionsAlternative(preprocessedText);
    console.log(
      `Alternative extraction found ${alternativeQuestions.length} questions`
    );

    if (alternativeQuestions.length > extractedQuestions.length) {
      extractedQuestions = alternativeQuestions;
    }
  }

  // Third attempt if still not enough questions: Last resort method
  if (extractedQuestions.length < requestedCount) {
    console.log("Trying last resort extraction method...");
    const lastResortQuestions = extractQuestionsLastResort(preprocessedText);
    console.log(
      `Last resort extraction found ${lastResortQuestions.length} questions`
    );

    if (lastResortQuestions.length > extractedQuestions.length) {
      extractedQuestions = lastResortQuestions;
    }
  }

  console.log(
    `Final count of extracted questions: ${extractedQuestions.length}`
  );

  // Step 5: Extract answers and explanations
  const answersAndExplanations =
    extractAnswersAndExplanations(preprocessedText);
  console.log(
    `Extracted ${Object.keys(answersAndExplanations).length} answer sets`
  );

  // Count how many have good explanations
  const goodExplanations = Object.values(answersAndExplanations).filter(
    (a) => a.explanation && a.explanation.length > 20
  ).length;
  console.log(`Good explanations: ${goodExplanations}`);

  // Try another extraction method if we don't have enough good explanations
  if (goodExplanations < extractedQuestions.length / 2) {
    console.log("Trying full explanation extraction...");

    // Find answer matches in the text
    const answerMatches: {
      questionNumber: number;
      answer: string;
      position: number;
    }[] = [];
    const answerPattern = /(\d+)\s*\.\s*([A-D])/g;
    let match;

    while ((match = answerPattern.exec(preprocessedText)) !== null) {
      answerMatches.push({
        questionNumber: parseInt(match[1], 10),
        answer: match[2],
        position: match.index,
      });
    }

    // Extract more detailed explanations
    const fullExplanations = extractFullExplanations(
      preprocessedText,
      answerMatches
    );
    console.log(
      `Full explanation extraction found ${
        Object.keys(fullExplanations).length
      } explanations`
    );

    // Merge with existing answers, preferring the better explanation
    for (const [qNumStr, data] of Object.entries(fullExplanations)) {
      const qNum = parseInt(qNumStr, 10);

      // If we already have this answer, keep the better explanation
      if (qNum in answersAndExplanations) {
        const existing = answersAndExplanations[qNum].explanation;
        const newExpl = data.explanation;

        if (!existing || (newExpl && newExpl.length > existing.length)) {
          answersAndExplanations[qNum].explanation = newExpl;
        }

        // Keep the existing answer if present, otherwise use the new one
        if (!answersAndExplanations[qNum].answer && data.answer) {
          answersAndExplanations[qNum].answer = data.answer;
        }
      } else {
        // This is a new answer/explanation
        answersAndExplanations[qNum] = data;
      }
    }
  }

  // Try a section-based approach if still lacking explanations
  if (
    Object.values(answersAndExplanations).filter(
      (a) => a.explanation && a.explanation.length > 20
    ).length <
    extractedQuestions.length / 2
  ) {
    console.log("Trying explanation-by-section extraction...");
    const sectionExplanations = extractExplanationsBySection(preprocessedText);

    for (const [qNumStr, data] of Object.entries(sectionExplanations)) {
      const qNum = parseInt(qNumStr, 10);

      if (qNum in answersAndExplanations) {
        const existing = answersAndExplanations[qNum].explanation;
        const newExpl = data.explanation;

        if (!existing || (newExpl && newExpl.length > existing.length)) {
          answersAndExplanations[qNum].explanation = newExpl;
        }
      } else if (data.explanation && data.explanation.length > 20) {
        // Only add if we have a decent explanation
        answersAndExplanations[qNum] = {
          answer: guessAnswer(answersAndExplanations),
          explanation: data.explanation,
        };
      }
    }
  }

  // Check how many questions have good explanations after our extraction attempts
  const goodExplanationsCount = Object.values(answersAndExplanations).filter(
    (a) => a.explanation && a.explanation.length > 20
  ).length;
  console.log(
    `Questions with good explanations: ${goodExplanationsCount}/${extractedQuestions.length}`
  );

  // If less than 70% of questions have good explanations, try using findExplanationBoundaries
  if (goodExplanationsCount < extractedQuestions.length * 0.7) {
    console.log(
      "Using explanation boundaries to enhance existing explanations..."
    );
    const explanationBoundaries = findExplanationBoundaries(preprocessedText);
    console.log(
      `Found ${
        Object.keys(explanationBoundaries).length
      } explanation boundaries`
    );

    // Use these boundaries to enhance our existing answers
    for (const [qNumStr, boundary] of Object.entries(explanationBoundaries)) {
      const qNum = parseInt(qNumStr, 10);

      if (qNum in answersAndExplanations) {
        const existingExpl = answersAndExplanations[qNum].explanation;
        const newExpl = preprocessedText
          .substring(boundary.start, boundary.end)
          .trim();

        // Only replace if the new explanation is better
        if (
          newExpl &&
          (!existingExpl || newExpl.length > existingExpl.length)
        ) {
          answersAndExplanations[qNum].explanation = newExpl;
        }
      } else {
        // If we don't have an answer for this question yet, add it with a guessed answer
        answersAndExplanations[qNum] = {
          answer: guessAnswer(answersAndExplanations),
          explanation: preprocessedText
            .substring(boundary.start, boundary.end)
            .trim(),
        };
      }
    }

    // Log how many questions now have good explanations
    const enhancedExplanationsCount = Object.values(
      answersAndExplanations
    ).filter((a) => a.explanation && a.explanation.length > 20).length;
    console.log(
      `Questions with good explanations after enhancement: ${enhancedExplanationsCount}/${extractedQuestions.length}`
    );
  }

  // Match questions with answers
  const finalQuestions = mergeQuestionsWithAnswers(
    extractedQuestions,
    answersAndExplanations
  );
  console.log(`Final questions after matching: ${finalQuestions.length}`);

  // Post-processing: Ensure all explanations are complete sentences
  for (let i = 0; i < finalQuestions.length; i++) {
    // Clean up the explanation: fix newlines, ensure proper sentences
    let explanation = finalQuestions[i].explanation;

    // Remove excess whitespace and normalize
    explanation = explanation.replace(/\s+/g, " ").trim();

    // Ensure the explanation starts with a capital letter
    if (explanation.length > 0 && explanation !== "No explanation available.") {
      explanation = explanation.charAt(0).toUpperCase() + explanation.slice(1);

      // Ensure it ends with proper punctuation
      if (!explanation.match(/[.!?]$/)) {
        explanation += ".";
      }
    }

    finalQuestions[i].explanation = explanation;
  }

  // If we still couldn't extract enough questions, use backup questions
  if (finalQuestions.length < 3) {
    console.log(`Using backup questions for ${mode} mode`);
    return getBackupQuestions(mode);
  }

  // Limit to requested count
  return finalQuestions.slice(0, requestedCount);
}

function splitTextIntoPages(pdfData: PDFData): string[] {
  // This is a simplified approach - in a real implementation,
  // you would use the page content directly from pdf-parse
  const pageTexts: string[] = [];

  // If we have access to individual pages
  if (pdfData.pages && Array.isArray(pdfData.pages)) {
    for (const page of pdfData.pages) {
      pageTexts.push(page.text || "");
    }
  } else {
    // Fallback to estimating page breaks
    const text = pdfData.text;
    const avgCharsPerPage = text.length / pdfData.numpages;

    for (let i = 0; i < pdfData.numpages; i++) {
      const start = Math.floor(i * avgCharsPerPage);
      const end = Math.floor((i + 1) * avgCharsPerPage);
      pageTexts.push(text.substring(start, end));
    }
  }

  return pageTexts;
}

function findKeyPageIndex(pages: string[], mode: ParsingMode = "DECA"): number {
  // Different patterns for DECA vs FBLA PDFs
  const patterns = {
    DECA: [
      /KEY/i,
      /ANSWER\s+KEY/i,
      /EXAM\s*[\-—]\s*KEY/i,
      /FINANCE\s+CLUSTER\s+EXAM[\-—]KEY/i,
      /ANSWER\s+SHEET/i,
      /SOLUTIONS/i,
      /CORRECT\s+ANSWERS/i,
    ],
    FBLA: [
      /KEY/i,
      /ANSWER\s+KEY/i,
      /EXAM\s*[\-—]\s*KEY/i,
      /ANSWER\s+SHEET/i,
      /SOLUTIONS/i,
      /CORRECT\s+ANSWERS/i,
      /OBJECTIVE\s+TEST\s+ANSWERS/i,
      /COMPETITIVE\s+EVENT\s+ANSWERS/i,
    ],
  };

  const patternsToUse = patterns[mode];

  for (let i = 0; i < pages.length; i++) {
    // Check if any pattern matches
    for (const pattern of patternsToUse) {
      if (pages[i].match(pattern)) {
        console.log(`Found answer key page at index ${i} using ${mode} patterns`);
        return i;
      }
    }
  }
  return -1;
}

function extractQuestionsAndOptions(text: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];

  // Regular expression to find questions and their options with complete text
  // Looking for patterns like:
  // 1. Question text
  //    A. Option A text
  //    B. Option B text
  //    etc.
  const questionPattern = /(\d+)\.\s+(.*?)(?=\s*\n\s*[A-D]\.|\n\s*\d+\.|$)/g;
  const optionPattern = /\s*([A-D])\.?\s+([^\n]+)/g;

  let match;
  while ((match = questionPattern.exec(text)) !== null) {
    const questionNumber = parseInt(match[1], 10);
    // Ensure we get the complete question text
    const questionText = match[2].trim();

    // Find the options section for this question
    let optionsText = "";
    const optionSectionPattern = new RegExp(
      `${questionNumber}\\..*?\\n((?:\\s*[A-D]\\..*?\\n)+)`,
      "s"
    );
    const optionSectionMatch = text.match(optionSectionPattern);

    if (optionSectionMatch) {
      optionsText = optionSectionMatch[1];
    } else {
      // Try to find options by looking ahead from the question
      const questionPos = match.index;
      const nextQuestionPattern = new RegExp(
        `\\s*(${questionNumber + 1})\\.[^\\n]+`,
        "g"
      );
      nextQuestionPattern.lastIndex = questionPos;
      const nextQuestionMatch = nextQuestionPattern.exec(text);

      const endPos = nextQuestionMatch ? nextQuestionMatch.index : text.length;
      optionsText = text.substring(questionPos + match[0].length, endPos);
    }

    // Extract all options for this question
    const options = [];
    let optionMatch;

    optionPattern.lastIndex = 0; // Reset regex index
    while ((optionMatch = optionPattern.exec(optionsText)) !== null) {
      options.push({
        id: uuidv4(),
        label: optionMatch[1],
        text: optionMatch[2].trim(),
      });
    }

    if (options.length > 0) {
      questions.push({
        id: uuidv4(),
        questionNumber,
        text: questionText,
        options,
      });
    }
  }

  return questions;
}

function extractQuestionsAlternative(text: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];

  // Look for numbered questions with lettered options
  // This is a more relaxed pattern that might catch more questions
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let currentQuestion: Partial<Question> | null = null;
  let currentQuestionText = "";

  for (let i = 0; i < lines.length; i++) {
    // Check if line starts with a number followed by period (likely a question)
    const questionMatch = lines[i].match(/^(\d+)\.\s+(.+)/);
    if (questionMatch) {
      // If we were processing a question, add it to our list
      if (
        currentQuestion &&
        currentQuestion.options &&
        currentQuestion.options.length > 0
      ) {
        currentQuestion.text = currentQuestionText.trim();
        questions.push(currentQuestion);
      }

      // Start a new question
      const questionNumber = parseInt(questionMatch[1], 10);
      currentQuestionText = questionMatch[2];

      // Look ahead to collect multi-line question text
      let j = i + 1;
      while (
        j < lines.length &&
        !lines[j].match(/^(\d+)\./) &&
        !lines[j].match(/^[A-D]\./) &&
        !lines[j].match(/^Explanation:/i)
      ) {
        currentQuestionText += " " + lines[j];
        j++;
      }

      currentQuestion = {
        id: uuidv4(),
        questionNumber,
        text: currentQuestionText.trim(),
        options: [],
      };
      continue;
    }

    // Check if line starts with A, B, C, or D (likely an option)
    const optionMatch = lines[i].match(/^([A-D])\.?\s+(.+)/);
    if (optionMatch && currentQuestion) {
      if (!currentQuestion.options) {
        currentQuestion.options = [];
      }

      // Get the full option text, which might span multiple lines
      let optionText = optionMatch[2];

      // Look ahead for continuation lines that belong to this option
      let k = i + 1;
      while (
        k < lines.length &&
        !lines[k].match(/^(\d+)\./) &&
        !lines[k].match(/^[A-D]\./) &&
        !lines[k].match(/^Explanation:/i)
      ) {
        optionText += " " + lines[k];
        k++;
      }

      currentQuestion.options.push({
        id: uuidv4(),
        label: optionMatch[1],
        text: optionText.trim(),
      });
    }
  }

  // Add the last question if it exists
  if (
    currentQuestion &&
    currentQuestion.options &&
    currentQuestion.options.length > 0
  ) {
    currentQuestion.text = currentQuestionText.trim();
    questions.push(currentQuestion);
  }

  return questions;
}

function extractQuestionsLastResort(text: string): Partial<Question>[] {
  const questions: Partial<Question>[] = [];

  // This is a very aggressive pattern that looks for any possible questions
  // It's more likely to have false positives, but better than nothing

  // Find all potential question numbers (1-100)
  const questionNumbers = [];
  const numberPattern = /\b(\d{1,2})\.\s+([^\n]+)/g;
  let numMatch;

  while ((numMatch = numberPattern.exec(text)) !== null) {
    const num = parseInt(numMatch[1], 10);
    if (num > 0 && num <= 100) {
      // Get the text after the number
      const questionText = numMatch[2].trim();

      questionNumbers.push({
        number: num,
        text: questionText,
        index: numMatch.index,
      });
    }
  }

  // Sort by position in text
  questionNumbers.sort((a, b) => a.index - b.index);

  // Try to find options for each question
  for (let i = 0; i < questionNumbers.length; i++) {
    const q = questionNumbers[i];
    const options = [];

    // Look for options in the text between this question and the next
    const startIdx = q.index + q.text.length;
    const endIdx =
      i < questionNumbers.length - 1
        ? questionNumbers[i + 1].index
        : text.length;
    const optionsText = text.substring(startIdx, endIdx);

    // Look for option patterns like "A.", "B.", etc.
    const optionPattern = /([A-D])\.\s+([^\n]+)/g;
    let optMatch;

    while ((optMatch = optionPattern.exec(optionsText)) !== null) {
      options.push({
        id: uuidv4(),
        label: optMatch[1],
        text: optMatch[2].trim(),
      });
    }

    // If we found at least 2 options, consider it a valid question
    if (options.length >= 2) {
      questions.push({
        id: uuidv4(),
        questionNumber: q.number,
        text: q.text,
        options,
      });
    }
  }

  return questions;
}

function extractAnswersAndExplanations(
  text: string
): Record<number, { answer: string; explanation: string }> {
  const answers: Record<number, { answer: string; explanation: string }> = {};

  // Preprocessing to improve text continuity
  const preprocessedText = text
    .replace(/([a-z])\n([a-z])/gi, "$1 $2")
    .replace(/\n+/g, "\n")
    .replace(/\.([A-Z])/g, ". $1"); // Fix periods without spaces

  // First, let's identify all the answer locations
  const answerMatches: {
    questionNumber: number;
    answer: string;
    position: number;
  }[] = [];
  const answerRegex = /(\d+)\.\s+([A-D])[:\.\s]/gi;
  let match;

  while ((match = answerRegex.exec(preprocessedText)) !== null) {
    answerMatches.push({
      questionNumber: parseInt(match[1], 10),
      answer: match[2],
      position: match.index,
    });
  }

  // Sort answers by position in the text
  answerMatches.sort((a, b) => a.position - b.position);

  console.log(`Found ${answerMatches.length} answer locations`);

  // Extract answer-explanation pairs by finding all Explanation markers
  const explanationMarkers: {
    position: number;
    length: number;
    text: string;
  }[] = [];

  // First find all explicit "Explanation:" markers
  const explicitMarkers =
    preprocessedText.match(/Explanation:?.*?(?=\n\d+\.|$)/gi) || [];

  for (const marker of explicitMarkers) {
    const position = preprocessedText.indexOf(marker);
    if (position !== -1) {
      // Look for the question number before this explanation
      const textBefore = preprocessedText.substring(
        Math.max(0, position - 150),
        position
      );
      const questionMatch = textBefore.match(/(\d+)\.\s+([A-D])[^\d]*$/);

      if (questionMatch) {
        const questionNumber = parseInt(questionMatch[1], 10);
        const explanationText = marker.replace(/^Explanation:?\s*/i, "").trim();

        explanationMarkers.push({
          position,
          length: marker.length,
          text: explanationText,
        });

        // Store this explanation
        const existingExplanation = answers[questionNumber]?.explanation || "";
        if (
          !existingExplanation ||
          explanationText.length > existingExplanation.length
        ) {
          if (!answers[questionNumber]) {
            answers[questionNumber] = {
              answer: questionMatch[2],
              explanation: explanationText,
            };
          } else {
            answers[questionNumber].explanation = explanationText;
          }
        }
      }
    }
  }

  // Now process each answer to find full explanations if we still don't have them
  for (let i = 0; i < answerMatches.length; i++) {
    const answer = answerMatches[i];
    const questionNumber = answer.questionNumber;

    // Skip if we already have a good explanation for this question
    if (
      answers[questionNumber] &&
      answers[questionNumber].explanation.length > 30
    ) {
      continue;
    }

    let explanation = "";

    // Find the text between this answer and the next one
    const nextPosition =
      i < answerMatches.length - 1
        ? answerMatches[i + 1].position
        : preprocessedText.length;
    const textBetween = preprocessedText.substring(
      answer.position,
      nextPosition
    );

    // Look for explicit explanation markers
    const explanationMarkerIndex = textBetween.search(/Explanation:?\s*/i);

    if (explanationMarkerIndex !== -1) {
      // Get everything after the explanation marker until the next question number
      const markerMatch = textBetween.match(/Explanation:?\s*/i);
      if (markerMatch) {
        const markerEnd = explanationMarkerIndex + markerMatch[0].length;
        let explanationText = textBetween.substring(markerEnd);

        // Look for patterns that might indicate the end of this explanation
        const nextQuestionMatch = explanationText.match(/\n\s*\d+\.\s/);
        if (nextQuestionMatch) {
          explanationText = explanationText.substring(
            0,
            nextQuestionMatch.index
          );
        }

        explanation = explanationText.trim();
      }
    }
    // If no explicit marker, try to find any text after the answer that might be an explanation
    else {
      // Get the text right after this answer line
      const remainingText = textBetween.replace(/^.*\n/, "").trim();

      // Check if it looks like an explanation (doesn't start with a question number or option)
      if (
        remainingText &&
        !remainingText.match(/^\d+\./) &&
        !remainingText.match(/^[A-D]\./)
      ) {
        // Collect all text until we hit a pattern that suggests the start of another question
        let endIndex = remainingText.search(/\n\s*\d+\.\s/);
        if (endIndex === -1) endIndex = remainingText.length;

        explanation = remainingText.substring(0, endIndex).trim();
      }
    }

    // Final cleanup of the explanation
    if (explanation) {
      // Remove any new question numbers that might have snuck in
      const nextQuestionPattern = new RegExp(
        `\\b${questionNumber + 1}\\.\\s+`,
        "i"
      );
      const nextQuestionMatch = nextQuestionPattern.exec(explanation);
      if (nextQuestionMatch) {
        explanation = explanation
          .substring(0, nextQuestionMatch.index ?? explanation.length)
          .trim();
      }

      // Store the answer and explanation
      answers[questionNumber] = {
        answer: answer.answer,
        explanation: explanation || "No explanation available.",
      };
    } else if (!answers[questionNumber]) {
      // If we still don't have an explanation, set a default
      answers[questionNumber] = {
        answer: answer.answer,
        explanation: "No explanation available.",
      };
    }
  }

  // Post-processing: Ensure all explanations are complete sentences
  for (const [, data] of Object.entries(answers)) {
    if (
      data.explanation !== "No explanation available." &&
      data.explanation.length > 0
    ) {
      // If explanation doesn't end with proper punctuation, check if it might be truncated
      if (!data.explanation.match(/[.!?]$/)) {
        // This explanation might be truncated, try to find it in the full text
        const explanationStart = preprocessedText.indexOf(
          data.explanation.substring(0, Math.min(50, data.explanation.length))
        );

        if (explanationStart !== -1) {
          // Look for the end of this explanation
          let explanationEnd = explanationStart + data.explanation.length;

          // Try to extend to the next complete sentence
          const remainingText = preprocessedText.substring(explanationEnd);
          const nextSentenceEnd = remainingText.search(/[.!?]\s/);

          if (nextSentenceEnd !== -1 && nextSentenceEnd < 200) {
            // Reasonable limit
            explanationEnd += nextSentenceEnd + 2; // Include the punctuation and space
          }

          // Ensure we don't go into the next question
          const nextQuestionMatch = preprocessedText
            .substring(explanationEnd)
            .match(/\n\s*\d+\.\s/);
          if (
            nextQuestionMatch &&
            typeof nextQuestionMatch.index === "number" &&
            nextQuestionMatch.index < 100
          ) {
            explanationEnd += nextQuestionMatch.index;
          }

          // Get the extended explanation
          data.explanation = preprocessedText
            .substring(explanationStart, explanationEnd)
            .trim();
        }
      }
    }
  }

  // If we have very few explanations, try a more aggressive approach
  if (
    Object.values(answers).filter(
      (a) => a.explanation !== "No explanation available."
    ).length < 3
  ) {
    return extractFullExplanations(preprocessedText, answerMatches);
  }

  return answers;
}

function extractFullExplanations(
  text: string,
  answerMatches: { questionNumber: number; answer: string; position: number }[]
): Record<number, { answer: string; explanation: string }> {
  const answers: Record<number, { answer: string; explanation: string }> = {};

  // Split the text into sections by question number
  const sections: {
    questionNumber: number;
    startPos: number;
    endPos: number;
  }[] = [];

  // Mark the start and end positions of each answer section
  for (let i = 0; i < answerMatches.length; i++) {
    const current = answerMatches[i];
    const nextPos =
      i < answerMatches.length - 1
        ? answerMatches[i + 1].position
        : text.length;

    sections.push({
      questionNumber: current.questionNumber,
      startPos: current.position,
      endPos: nextPos,
    });
  }

  // Process each section to extract its explanation
  for (const section of sections) {
    const sectionText = text.substring(section.startPos, section.endPos);
    let explanation = "";

    // Method 1: Look for "Explanation:" marker
    const explMarker = sectionText.match(/Explanation:?\s*/i);
    if (explMarker) {
      explanation = sectionText
        .substring((explMarker.index ?? 0) + explMarker[0].length)
        .trim();
    }
    // Method 2: Assume everything after the answer indicator is the explanation
    else {
      // Find the first line break after the answer indicator
      const firstLineBreak = sectionText.indexOf("\n");
      if (firstLineBreak !== -1) {
        explanation = sectionText.substring(firstLineBreak).trim();
      }
    }

    // Clean up the explanation
    if (explanation) {
      // Remove anything that looks like the start of another question
      const nextQuestionMatch = explanation.match(/\n\s*\d+\.\s/);
      if (nextQuestionMatch) {
        explanation = explanation
          .substring(0, nextQuestionMatch.index ?? explanation.length)
          .trim();
      }

      // Store the answer and explanation
      answers[section.questionNumber] = {
        answer:
          answerMatches.find((a) => a.questionNumber === section.questionNumber)
            ?.answer || "A",
        explanation: explanation,
      };
    } else {
      // Default if no explanation found
      answers[section.questionNumber] = {
        answer:
          answerMatches.find((a) => a.questionNumber === section.questionNumber)
            ?.answer || "A",
        explanation: "No explanation available.",
      };
    }
  }

  return answers;
}

// Enhanced function to extract explanations with a different approach
function extractExplanationsBySection(
  text: string
): Record<number, { explanation: string }> {
  const explanations: Record<number, { explanation: string }> = {};

  // Preprocess text to improve parsing
  const preprocessedText = text
    .replace(/([a-z])\n([a-z])/gi, "$1 $2") // Fix line breaks in the middle of sentences
    .replace(/\n+/g, "\n") // Normalize line breaks
    .replace(/\.([A-Z])/g, ". $1"); // Fix periods without spaces

  // Split the text into chunks at explanation markers
  const chunks = preprocessedText.split(/(?=Explanation:?)/i);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim();

    // Skip if this chunk doesn't look like an explanation
    if (!chunk.match(/^Explanation:?/i)) continue;

    // Extract the explanation text (everything after "Explanation:")
    const explanationText = chunk.replace(/^Explanation:?\s*/i, "").trim();

    // Try to determine which question this explanation belongs to
    // Check the chunk before this one
    const prevChunk = i > 0 ? chunks[i - 1] : "";

    // Look for the last question number and answer in the previous chunk
    const questionMatch = prevChunk.match(/(\d+)\.\s+([A-D])[^\d]*$/);

    if (questionMatch) {
      const questionNumber = parseInt(questionMatch[1], 10);

      // Get the complete explanation (until the next question)
      let completeExplanation = explanationText;

      // Look for a pattern that might indicate the start of another question
      const nextQuestionMatch = completeExplanation.match(/\n\s*\d+\.\s/);
      if (nextQuestionMatch) {
        completeExplanation = completeExplanation
          .substring(0, nextQuestionMatch.index)
          .trim();
      }

      explanations[questionNumber] = {
        explanation: completeExplanation,
      };
    }
  }

  return explanations;
}

// Additional fallback function for extracting explanations
function findExplanationBoundaries(
  text: string
): Record<number, { start: number; end: number }> {
  const boundaries: Record<number, { start: number; end: number }> = {};

  // Look for "Explanation:" markers
  const explanationMarkers = [];
  const markerRegex = /Explanation:?\s*(?=\S)/gi;
  let markerMatch;

  while ((markerMatch = markerRegex.exec(text)) !== null) {
    explanationMarkers.push({
      position: markerMatch.index,
      length: markerMatch[0].length,
    });
  }

  // Find question numbers associated with each explanation marker
  for (let i = 0; i < explanationMarkers.length; i++) {
    const markerPos = explanationMarkers[i].position;

    // Look backward for the closest question number
    const prevText = text.substring(Math.max(0, markerPos - 100), markerPos);
    const questionMatch = prevText.match(/(\d+)\.\s*[A-D]/);

    if (questionMatch) {
      const questionNumber = parseInt(questionMatch[1], 10);
      const start = markerPos + explanationMarkers[i].length;
      const end =
        i < explanationMarkers.length - 1
          ? explanationMarkers[i + 1].position
          : text.length;

      boundaries[questionNumber] = { start, end };
    }
  }

  return boundaries;
}

// Improved function to merge questions with answers
function mergeQuestionsWithAnswers(
  questions: Partial<Question>[],
  answers: Record<number, { answer: string; explanation: string }>
): Question[] {
  const mergedQuestions: Question[] = [];

  // Sort questions by question number to ensure proper order
  questions.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

  for (const question of questions) {
    if (!question.questionNumber) continue;

    const answerData = answers[question.questionNumber];

    // If we have answer data for this question
    if (answerData) {
      mergedQuestions.push({
        id: question.id || uuidv4(),
        questionNumber: question.questionNumber,
        text: question.text || `Question ${question.questionNumber}`,
        options: question.options || [],
        correctAnswer: answerData.answer,
        explanation: answerData.explanation,
      });
    } else {
      // If we don't have answer data, use a reasonable guess
      // Try to find the most common answer among other questions, fallback to 'A'
      let mostCommonAnswer = "A";
      const answerCounts = { A: 0, B: 0, C: 0, D: 0 };

      Object.values(answers).forEach((a) => {
        if (a.answer in answerCounts) {
          answerCounts[a.answer as keyof typeof answerCounts]++;
        }
      });

      // Find the most common answer
      let maxCount = 0;
      Object.entries(answerCounts).forEach(([answer, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommonAnswer = answer;
        }
      });

      mergedQuestions.push({
        id: question.id || uuidv4(),
        questionNumber: question.questionNumber,
        text: question.text || `Question ${question.questionNumber}`,
        options: question.options || [],
        correctAnswer: mostCommonAnswer,
        explanation: "Explanation not available for this question.",
      });
    }
  }

  return mergedQuestions;
}

// Mode-specific backup questions
function getBackupQuestions(mode: ParsingMode = "DECA"): Question[] {
  if (mode === "FBLA") {
    return getFBLABackupQuestions();
  }
  return getDECABackupQuestions();
}

function getDECABackupQuestions(): Question[] {
  // DECA-specific backup questions
  return [
    {
      id: uuidv4(),
      questionNumber: 1,
      text: "Which of the following is a characteristic of a legally binding contract:",
      options: [
        {
          id: uuidv4(),
          label: "A",
          text: "The contract must be written and signed.",
        },
        {
          id: uuidv4(),
          label: "B",
          text: "One of the parties must be in agreement.",
        },
        {
          id: uuidv4(),
          label: "C",
          text: "The contract must include an expiration date.",
        },
        {
          id: uuidv4(),
          label: "D",
          text: "Something of value must be exchanged.",
        },
      ],
      correctAnswer: "D",
      explanation:
        "Something of value must be exchanged. A legally binding contract must meet two requirements: something of value must be exchanged, and both parties must be in agreement with the terms of the contract.",
    },
    {
      id: uuidv4(),
      questionNumber: 2,
      text: "What type of business ownership structure provides limited liability to its owners?",
      options: [
        { id: uuidv4(), label: "A", text: "Sole proprietorship" },
        { id: uuidv4(), label: "B", text: "Partnership" },
        { id: uuidv4(), label: "C", text: "Corporation" },
        { id: uuidv4(), label: "D", text: "Franchise" },
      ],
      correctAnswer: "C",
      explanation:
        "Corporation. A corporation is a legal entity separate from its owners, providing limited liability protection to shareholders. This means owners are not personally responsible for business debts beyond their investment.",
    },
    {
      id: uuidv4(),
      questionNumber: 3,
      text: "Which economic system is characterized by private ownership and free markets?",
      options: [
        { id: uuidv4(), label: "A", text: "Socialism" },
        { id: uuidv4(), label: "B", text: "Capitalism" },
        { id: uuidv4(), label: "C", text: "Communism" },
        { id: uuidv4(), label: "D", text: "Command economy" },
      ],
      correctAnswer: "B",
      explanation:
        "Capitalism. Capitalism is an economic system based on private ownership of resources and businesses, where market forces of supply and demand determine prices and production.",
    },
  ];
}

// Helper function to guess a likely answer based on existing data
function guessAnswer(
  answers: Record<number, { answer: string; explanation: string }>
): string {
  const answerCounts = { A: 0, B: 0, C: 0, D: 0 };

  // Count the frequency of each answer
  Object.values(answers).forEach((a) => {
    if (a.answer in answerCounts) {
      answerCounts[a.answer as keyof typeof answerCounts]++;
    }
  });

  // Find the most common answer
  let mostCommon = "A";
  let maxCount = 0;

  Object.entries(answerCounts).forEach(([answer, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = answer;
    }
  });

  return mostCommon;
}

function getFBLABackupQuestions(): Question[] {
  // FBLA-specific backup questions
  return [
    {
      id: uuidv4(),
      questionNumber: 1,
      text: "Which of the following is a characteristic of a legally binding contract:",
      options: [
        {
          id: uuidv4(),
          label: "A",
          text: "The contract must be written and signed.",
        },
        {
          id: uuidv4(),
          label: "B",
          text: "One of the parties must be in agreement.",
        },
        {
          id: uuidv4(),
          label: "C",
          text: "The contract must include an expiration date.",
        },
        {
          id: uuidv4(),
          label: "D",
          text: "Something of value must be exchanged.",
        },
      ],
      correctAnswer: "D",
      explanation:
        "Something of value must be exchanged. A legally binding contract must meet two requirements: something of value must be exchanged, and both parties must be in agreement with the terms of the contract.",
    },
    {
      id: uuidv4(),
      questionNumber: 2,
      text: "What type of business ownership structure provides limited liability to its owners?",
      options: [
        { id: uuidv4(), label: "A", text: "Sole proprietorship" },
        { id: uuidv4(), label: "B", text: "Partnership" },
        { id: uuidv4(), label: "C", text: "Corporation" },
        { id: uuidv4(), label: "D", text: "Franchise" },
      ],
      correctAnswer: "C",
      explanation:
        "Corporation. A corporation is a legal entity separate from its owners, providing limited liability protection to shareholders. This means owners are not personally responsible for business debts beyond their investment.",
    },
    {
      id: uuidv4(),
      questionNumber: 3,
      text: "Which economic system is characterized by private ownership and free markets?",
      options: [
        { id: uuidv4(), label: "A", text: "Socialism" },
        { id: uuidv4(), label: "B", text: "Capitalism" },
        { id: uuidv4(), label: "C", text: "Communism" },
        { id: uuidv4(), label: "D", text: "Command economy" },
      ],
      correctAnswer: "B",
      explanation:
        "Capitalism. Capitalism is an economic system based on private ownership of resources and businesses, where market forces of supply and demand determine prices and production.",
    },
  ];
}

