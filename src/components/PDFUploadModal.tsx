"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { type FBLAQuestion } from "@/lib/fbla-questions";

// PDF processing statuses
type ProcessingStatus = "idle" | "processing" | "success" | "error";

interface PDFUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (questions: FBLAQuestion[]) => void;
}

export default function PDFUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: PDFUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] =
    useState<ProcessingStatus>("idle");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(10);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const uploadedFile = acceptedFiles[0];

    if (uploadedFile && uploadedFile.type !== "application/pdf") {
      setError("Only PDF files are supported");
      return;
    }

    setFile(uploadedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: processingStatus === "processing",
  });

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setProcessingStatus("processing");
    setProcessingProgress(0);
    setError(null);

    // Start progress animation
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        const newProgress = prev + 2;
        if (newProgress >= 90) {
          return 90; // Hold at 90% until we get actual response
        }
        return newProgress;
      });
    }, 100);

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("questionCount", questionCount.toString());

      // 🔧 API ENDPOINT: Send PDF to FBLA-specific processing endpoint
      const apiUrl = "/api/fbla/process-pdf";
      console.log("Calling API:", apiUrl);
      console.log("FormData contents:", {
        pdf: file.name,
        questionCount: questionCount,
      });
      
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.error || "Failed to process PDF";
        throw new Error(errorMessage);
      }

      // Get the extracted questions from the response
      const data = await response.json();

      clearInterval(progressInterval);
      setProcessingProgress(100);
      setProcessingStatus("success");

      // Convert extracted questions to FBLA format
      const fblaQuestions: FBLAQuestion[] = data.questions.map(
        (q: any, index: number) => ({
          id: index + 1,
          question: q.text,
          options: {
            A: q.options.find((opt: any) => opt.label === "A")?.text || "",
            B: q.options.find((opt: any) => opt.label === "B")?.text || "",
            C: q.options.find((opt: any) => opt.label === "C")?.text || "",
            D: q.options.find((opt: any) => opt.label === "D")?.text || "",
          },
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: "Medium" as const, // Default difficulty, could be enhanced later
        })
      );

      // Store questions in sessionStorage for quiz use
      sessionStorage.setItem("fbla-custom-questions", JSON.stringify(fblaQuestions));

      // Call success callback
      setTimeout(() => {
        onSuccess(fblaQuestions);
        handleClose();
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Upload Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process the PDF";
      console.error("Error message:", errorMessage);
      setError(errorMessage);
      setProcessingStatus("error");
    }
  }, [file, questionCount, onSuccess]);

  const handleClose = () => {
    if (processingStatus !== "processing") {
      setFile(null);
      setError(null);
      setProcessingStatus("idle");
      setProcessingProgress(0);
      onClose();
    }
  };

  const questionCountOptions = [10, 25, 50, 100];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0A0A0F] border-white/10">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-white">
              Upload FBLA Study Material
            </CardTitle>
            <button
              onClick={handleClose}
              disabled={processingStatus === "processing"}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Upload any FBLA practice test or study guide PDF to create a custom
            quiz
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-[#EC4899] bg-[#EC4899]/5"
                : "border-white/20 hover:border-[#EC4899]/50"
            } ${
              processingStatus === "processing"
                ? "opacity-50 pointer-events-none"
                : ""
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#EC4899]/20 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-[#EC4899]" />
                </div>
                <div>
                  <p className="text-lg font-medium text-white">{file.name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {processingStatus !== "processing" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setError(null);
                    }}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove file
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#EC4899]/20 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-[#EC4899]" />
                </div>
                <div>
                  <p className="text-lg font-medium text-white mb-1">
                    {isDragActive
                      ? "Drop your PDF here"
                      : "Drag & drop your FBLA PDF here"}
                  </p>
                  <p className="text-sm text-gray-400">
                    or click to select a file
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {processingStatus === "processing" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#EC4899] animate-spin" />
                <p className="text-sm text-gray-300">
                  Processing PDF and extracting questions...
                </p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                This may take a few moments depending on the PDF size
              </p>
            </div>
          )}

          {/* Success Message */}
          {processingStatus === "success" && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-400">
                  PDF processed successfully! Starting your custom quiz...
                </p>
              </div>
            </div>
          )}

          {/* Question Count Selection */}
          {processingStatus !== "success" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Number of Questions to Extract
              </label>
              <div className="grid grid-cols-4 gap-3">
                {questionCountOptions.map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    disabled={processingStatus === "processing"}
                    className={`py-3 px-4 rounded-lg border transition-all font-medium ${
                      questionCount === count
                        ? "bg-[#EC4899] text-white border-[#EC4899]"
                        : "bg-white/5 text-gray-300 border-white/10 hover:border-[#EC4899]/50"
                    } ${
                      processingStatus === "processing"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClose}
              disabled={processingStatus === "processing"}
              variant="outline"
              className="flex-1 border-white/10 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || processingStatus === "processing"}
              className="flex-1 bg-[#EC4899] hover:bg-[#EC4899]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingStatus === "processing" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Create Quiz
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

