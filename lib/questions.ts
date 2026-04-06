export interface Question {
    id: number;
    subject: string;
    topic: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    exam: string; // কোন পরীক্ষায় এসেছে (যেমন: GST 24-25)
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
      exam: "GST: 24-25"
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
      exam: "GST: 23-24"
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
      exam: "GST: 22-23"
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
      exam: "GST: 21-22"
    }
  ];