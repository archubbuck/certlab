import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface QuizData {
  quizTitle: string;
  categoryName: string;
  totalQuestions: number;
  score: number;
  correctAnswers: number;
  questions: {
    id: number;
    text: string;
    options: { id: number; text: string }[];
    correctAnswer: number;
    userAnswer?: number;
    explanation?: string;
    isCorrect: boolean;
  }[];
}

export async function generateLectureNotes(quizData: QuizData): Promise<string> {
  try {
    const prompt = `
You are an expert educational content creator. Generate comprehensive lecture notes based on the following quiz review data. 
Create a well-structured, educational document that helps the student understand the concepts better.

Quiz Details:
- Title: ${quizData.quizTitle}
- Category: ${quizData.categoryName}
- Score: ${quizData.score}% (${quizData.correctAnswers}/${quizData.totalQuestions} correct)

Quiz Questions and Review:
${quizData.questions.map((q, index) => `
Question ${index + 1}: ${q.text}

Options:
${q.options.map(opt => `  ${opt.id}. ${opt.text}`).join('\n')}

Correct Answer: ${q.correctAnswer}. ${q.options.find(opt => opt.id === q.correctAnswer)?.text}
User Answer: ${q.userAnswer ? `${q.userAnswer}. ${q.options.find(opt => opt.id === q.userAnswer)?.text}` : 'Not answered'}
Result: ${q.isCorrect ? 'Correct' : 'Incorrect'}
${q.explanation ? `Explanation: ${q.explanation}` : ''}
`).join('\n---\n')}

Please generate comprehensive lecture notes that:
1. Provide an overview of the key concepts covered
2. Explain the main topics in detail with clear explanations
3. Highlight important points that were commonly missed
4. Include study tips and best practices
5. Organize content with clear headings and structure
6. Focus on educational value and deeper understanding

Format the response as structured lecture notes with proper markdown formatting.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator specializing in comprehensive study materials. Create well-structured, informative lecture notes that help students understand complex concepts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3
    });

    return response.choices[0].message.content || "Failed to generate lecture notes.";
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate lecture notes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}