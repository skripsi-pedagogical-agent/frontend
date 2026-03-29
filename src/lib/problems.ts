export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  statusId?: 0 | 1 | 2;
  category: string;
  description: string;
  starterCode: string;
  testCases: TestCase[];
  slug: string;
  validator: (outputLines: string[]) => boolean;
}

const DEFAULT_BACKEND_TEST_CASES: TestCase[] = [
  {
    id: 1,
    input: "None",
    expectedOutput: "Output will be validated by backend.",
  },
];

export function mapBackendProblemToFrontend(backendProblem: {
  id: string;
  title: string;
  difficulty: string;
  status_id?: 0 | 1 | 2 | null;
  description: string;
  starter_code: string;
  topic: string;
  slug: string;
  test_cases?: Array<{
    id: string;
    input_data: string;
    expected_output: string;
  }>;
}): Problem {
  // Convert difficulty format from EASY/MEDIUM/HARD to Easy/Medium/Hard
  const difficultyMap: Record<string, "Easy" | "Medium" | "Hard"> = {
    EASY: "Easy",
    MEDIUM: "Medium",
    HARD: "Hard",
  };

  return {
    id: backendProblem.id,
    title: backendProblem.title,
    difficulty: difficultyMap[backendProblem.difficulty] || "Easy",
    statusId:
      backendProblem.status_id === 0 ||
      backendProblem.status_id === 1 ||
      backendProblem.status_id === 2
        ? backendProblem.status_id
        : undefined,
    category: backendProblem.topic,
    description: backendProblem.description,
    starterCode: backendProblem.starter_code,
    slug: backendProblem.slug,
    testCases:
      backendProblem.test_cases && backendProblem.test_cases.length > 0
        ? backendProblem.test_cases.map((testCase, index) => ({
            id: index + 1,
            input: testCase.input_data,
            expectedOutput: testCase.expected_output,
          }))
        : DEFAULT_BACKEND_TEST_CASES,
    validator: () => true, // Placeholder validator - actual validation happens on backend
  };
}
