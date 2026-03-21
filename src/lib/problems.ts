export interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  description: string;
  starterCode: string;
  testCases: TestCase[];
  validator: (outputLines: string[]) => boolean;
}

export const PROBLEMS: Problem[] = [
  {
    id: "fizzbuzz",
    title: "FizzBuzz Challenge",
    difficulty: "Easy",
    category: "Logic",
    description: `Write a program that prints the numbers from 1 to 100.

But for multiples of three print "Fizz" instead of the number and for the multiples of five print "Buzz". For numbers which are multiples of both three and five print "FizzBuzz".`,
    starterCode: `def fizzbuzz():
    for i in range(1, 101):
        if i % 3 == 0 and i % 5 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)

fizzbuzz()`,
    testCases: [
      { id: 1, input: "None", expectedOutput: "1\n2\nFizz\n4\nBuzz\n..." },
      { id: 2, input: "None", expectedOutput: "...98\nFizz\nBuzz" },
    ],
    validator: (outputLines: string[]) => {
      if (outputLines.length < 100) return false;
      for (let i = 1; i <= 100; i += 1) {
        let expected = "";
        if (i % 3 === 0 && i % 5 === 0) expected = "FizzBuzz";
        else if (i % 3 === 0) expected = "Fizz";
        else if (i % 5 === 0) expected = "Buzz";
        else expected = i.toString();

        if (outputLines[i - 1]?.trim() !== expected) return false;
      }
      return true;
    },
  },
  {
    id: "sum-list",
    title: "Sum of a List",
    difficulty: "Easy",
    category: "Arrays",
    description:
      "Write a function sum_list(numbers) that takes a list of numbers and returns their sum.",
    starterCode: `def sum_list(numbers):
    # Your code here
    pass

# Test your function
print(sum_list([1, 2, 3, 4, 5]))`,
    testCases: [
      { id: 1, input: "[1, 2, 3, 4, 5]", expectedOutput: "15" },
      { id: 2, input: "[10, -5, 20]", expectedOutput: "25" },
      { id: 3, input: "[]", expectedOutput: "0" },
    ],
    validator: (outputLines: string[]) => outputLines.length > 0,
  },
  {
    id: "palindrome",
    title: "Palindrome Checker",
    difficulty: "Medium",
    category: "Strings",
    description:
      "Write a function is_palindrome(s) that checks if a string is a palindrome.",
    starterCode: `def is_palindrome(s):
    # Your code here
    pass

# Test your function
print(is_palindrome("racecar"))`,
    testCases: [
      { id: 1, input: '"racecar"', expectedOutput: "True" },
      { id: 2, input: '"python"', expectedOutput: "False" },
    ],
    validator: (outputLines: string[]) => outputLines.length > 0,
  },
  {
    id: "fib",
    title: "Fibonacci Sequence",
    difficulty: "Medium",
    category: "Recursion",
    description: `Write a function fib(n) that returns the n-th Fibonacci number.

The sequence starts: 0, 1, 1, 2, 3, 5, 8, 13, 21, ...
fib(0) = 0
fib(1) = 1`,
    starterCode: `def fib(n):
    # Your code here
    pass

# Test your function
print(fib(6))`,
    testCases: [
      { id: 1, input: "6", expectedOutput: "8" },
      { id: 2, input: "10", expectedOutput: "55" },
      { id: 3, input: "0", expectedOutput: "0" },
    ],
    validator: (outputLines: string[]) => outputLines.length > 0,
  },
];

export function getProblemBySlug(slug: string): Problem | undefined {
  return PROBLEMS.find((problem) => problem.id === slug);
}
