export interface Question {
  id: number;
  subject: string;
  topic: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  exam: string;
  explanation?: string; // 🆕 নতুন ফিল্ড অ্যাড করা হলো
}

export const physicsQuestions: Question[] = [
  {
    id: 1,
    subject: "Physics",
    topic: "মহাকর্ষ ও অভিকর্ষ",
    questionText: "ভূ-পৃষ্ঠ হতে কত গভীরে অভিকর্ষীয় ত্বরণের মান ভূ-পৃষ্ঠের মানের এক-চতুর্থাংশ হবে? (R = পৃথিবীর ব্যাসার্ধ)",
    options: [
      "A. R/4",
      "B. R/2",
      "C. 3R/4",
      "D. R"
    ],
    correctAnswer: "C. 3R/4",
    exam: "GST: 24-25",
    explanation: "আমরা জানি, h গভীরে অভিকর্ষজ ত্বরণ g' = g(1 - h/R)। প্রশ্নমতে, g' = g/4। সুতরাং, g/4 = g(1 - h/R) ➞ 1/4 = 1 - h/R ➞ h/R = 1 - 1/4 = 3/4 ➞ h = 3R/4।"
  },
  {
    id: 2,
    subject: "Physics",
    topic: "মহাকর্ষ ও অভিকর্ষ",
    questionText: "একটি কৃত্রিম উপগ্রহ নিজ অক্ষে 10 ঘণ্টায় আবর্তন করে। এর ব্যাস 14×10^3 m; 10^4 kg ভরবিশিষ্ট একটি নভোযান উপগ্রহটিতে অবতরণ করলে উপগ্রহের নিজ অক্ষের ঘূর্ণনের কারণে নভোযানের ওজন কত হ্রাস পাবে?",
    options: [
      "A. 21.44N",
      "B. 24.21N",
      "C. 21.24N",
      "D. 24.44N"
    ],
    correctAnswer: "C. 21.24N",
    exam: "GST: 23-24",
    explanation: "ঘূর্ণনের কারণে ওজন হ্রাস = কেন্দ্রমুখী বল (F_c) = mrω² = m × r × (2π/T)²। এখানে m=10⁴ kg, r=(14×10³)/2 = 7000 m, T=10×3600 s। মান বসালে: 10⁴ × 7000 × (2π/36000)² ≈ 21.24 N।"
  },
  {
    id: 3,
    subject: "Physics",
    topic: "মহাকর্ষ ও অভিকর্ষ",
    questionText: "ভূ-পৃষ্ঠ থেকে R/2 (R = পৃথিবীর ব্যাসার্ধ) উচ্চতায় ও একই গভীরতায় অভিকর্ষজ ত্বরণের অনুপাত-",
    options: [
      "A. 1:9",
      "B. 2:9",
      "C. 4:9",
      "D. 8:9"
    ],
    correctAnswer: "D. 8:9",
    exam: "GST: 22-23",
    explanation: "h=R/2 উচ্চতায়: g_h = g / (1 + h/R)² = g / (1 + 1/2)² = 4g/9। আবার h=R/2 গভীরতায়: g_d = g(1 - h/R) = g(1 - 1/2) = g/2। অনুপাত: (4g/9) ÷ (g/2) = 8/9।"
  },
  {
    id: 4,
    subject: "Physics",
    topic: "মহাকর্ষ ও অভিকর্ষ",
    questionText: "মহাকর্ষীয় ধুবকের মাত্রা কোনটি?",
    options: [
      "A. M^-1L^3T^-2",
      "B. ML^2T^-2",
      "C. M^-2L^3T^-2",
      "D. ML^3T^-2"
    ],
    correctAnswer: "A. M^-1L^3T^-2",
    exam: "GST: 21-22",
    explanation: "নিউটনের মহাকর্ষ সূত্রানুসারে, F = G(m₁m₂)/r² ➞ G = Fr² / (m₁m₂)। মাত্রা বসালে: [G] = (MLT⁻²)(L²) / M² = M⁻¹L³T⁻²।"
  }
];