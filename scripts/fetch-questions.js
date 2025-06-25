const response = await fetch(
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Accounting_I_-_Batch_1_Questions-wJiNFNo79H2U63aewKKicy7SX8rWKL.csv",
)
const csvText = await response.text()

// Parse CSV
const lines = csvText.split("\n")
const headers = lines[0].split(",")
const questions = []

for (let i = 1; i < lines.length; i++) {
  if (lines[i].trim()) {
    const values = lines[i].split(",")
    const question = {
      question: values[0]?.replace(/"/g, ""),
      options: values[1]?.replace(/"/g, ""),
      correct_answer: values[2]?.replace(/"/g, ""),
      explanation: values[3]?.replace(/"/g, ""),
      difficulty: values[4]?.replace(/"/g, ""),
    }
    questions.push(question)
  }
}

console.log("Parsed questions:", questions)
console.log("Total questions:", questions.length)
