export const PYTHON_BUILTINS = [
  // Built-in functions
  {
    "label": "print",
    "kind": 1,
    "insertText": "print(${1:value})",
    "insertTextRules": 4,
    "documentation": "Print output to console",
    "sortText": "01_print"
  },
  {
    "label": "len",
    "kind": 1,
    "insertText": "len(${1:obj})",
    "insertTextRules": 4,
    "documentation": "Return the length of an object",
    "sortText": "02_len"
  },
  {
    "label": "range",
    "kind": 1,
    "insertText": "range(${1:start, stop})",
    "insertTextRules": 4,
    "documentation": "Generate a sequence of numbers",
    "sortText": "03_range"
  },
  {
    "label": "str",
    "kind": 1,
    "insertText": "str(${1:obj})",
    "insertTextRules": 4,
    "documentation": "Convert to string",
    "sortText": "04_str"
  },
  {
    "label": "int",
    "kind": 1,
    "insertText": "int(${1:x})",
    "insertTextRules": 4,
    "documentation": "Convert to integer",
    "sortText": "05_int"
  },
  {
    "label": "float",
    "kind": 1,
    "insertText": "float(${1:x})",
    "insertTextRules": 4,
    "documentation": "Convert to float",
    "sortText": "06_float"
  },
  {
    "label": "list",
    "kind": 1,
    "insertText": "list(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Create a list",
    "sortText": "07_list"
  },
  {
    "label": "dict",
    "kind": 1,
    "insertText": "dict(${1:mapping})",
    "insertTextRules": 4,
    "documentation": "Create a dictionary",
    "sortText": "08_dict"
  },
  {
    "label": "set",
    "kind": 1,
    "insertText": "set(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Create a set",
    "sortText": "09_set"
  },
  {
    "label": "tuple",
    "kind": 1,
    "insertText": "tuple(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Create a tuple",
    "sortText": "10_tuple"
  },
  {
    "label": "enumerate",
    "kind": 1,
    "insertText": "enumerate(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Enumerate items with index",
    "sortText": "11_enumerate"
  },
  {
    "label": "zip",
    "kind": 1,
    "insertText": "zip(${1:iter1, iter2})",
    "insertTextRules": 4,
    "documentation": "Combine multiple iterables",
    "sortText": "12_zip"
  },
  {
    "label": "map",
    "kind": 1,
    "insertText": "map(${1:func, iterable})",
    "insertTextRules": 4,
    "documentation": "Apply function to items",
    "sortText": "13_map"
  },
  {
    "label": "filter",
    "kind": 1,
    "insertText": "filter(${1:func, iterable})",
    "insertTextRules": 4,
    "documentation": "Filter items by condition",
    "sortText": "14_filter"
  },
  {
    "label": "sum",
    "kind": 1,
    "insertText": "sum(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Sum of items",
    "sortText": "15_sum"
  },
  {
    "label": "max",
    "kind": 1,
    "insertText": "max(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Maximum value",
    "sortText": "16_max"
  },
  {
    "label": "min",
    "kind": 1,
    "insertText": "min(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Minimum value",
    "sortText": "17_min"
  },
  {
    "label": "sorted",
    "kind": 1,
    "insertText": "sorted(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Sort items",
    "sortText": "18_sorted"
  },
  {
    "label": "reversed",
    "kind": 1,
    "insertText": "reversed(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Reverse items",
    "sortText": "19_reversed"
  },
  {
    "label": "abs",
    "kind": 1,
    "insertText": "abs(${1:x})",
    "insertTextRules": 4,
    "documentation": "Absolute value",
    "sortText": "20_abs"
  },
  {
    "label": "round",
    "kind": 1,
    "insertText": "round(${1:number, ndigits})",
    "insertTextRules": 4,
    "documentation": "Round a number",
    "sortText": "21_round"
  },
  {
    "label": "pow",
    "kind": 1,
    "insertText": "pow(${1:base, exp})",
    "insertTextRules": 4,
    "documentation": "Power function",
    "sortText": "22_pow"
  },
  {
    "label": "all",
    "kind": 1,
    "insertText": "all(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Check if all items are true",
    "sortText": "23_all"
  },
  {
    "label": "any",
    "kind": 1,
    "insertText": "any(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Check if any item is true",
    "sortText": "24_any"
  },
  {
    "label": "isinstance",
    "kind": 1,
    "insertText": "isinstance(${1:obj, type})",
    "insertTextRules": 4,
    "documentation": "Check instance type",
    "sortText": "25_isinstance"
  },
  {
    "label": "type",
    "kind": 1,
    "insertText": "type(${1:obj})",
    "insertTextRules": 4,
    "documentation": "Get object type",
    "sortText": "26_type"
  },
  {
    "label": "input",
    "kind": 1,
    "insertText": "input(${1:\"prompt\"})",
    "insertTextRules": 4,
    "documentation": "Read user input",
    "sortText": "27_input"
  },
  {
    "label": "open",
    "kind": 1,
    "insertText": "open(${1:\"filename\", \"mode\"})",
    "insertTextRules": 4,
    "documentation": "Open a file",
    "sortText": "28_open"
  },
  {
    "label": "bool",
    "kind": 1,
    "insertText": "bool(${1:x})",
    "insertTextRules": 4,
    "documentation": "Convert to boolean",
    "sortText": "29_bool"
  },
  {
    "label": "bytes",
    "kind": 1,
    "insertText": "bytes(${1:x})",
    "insertTextRules": 4,
    "documentation": "Convert to bytes",
    "sortText": "30_bytes"
  },
  {
    "label": "bytearray",
    "kind": 1,
    "insertText": "bytearray(${1:x})",
    "insertTextRules": 4,
    "documentation": "Create mutable bytes array",
    "sortText": "31_bytearray"
  },
  {
    "label": "complex",
    "kind": 1,
    "insertText": "complex(${1:real, imag})",
    "insertTextRules": 4,
    "documentation": "Create complex number",
    "sortText": "32_complex"
  },
  {
    "label": "frozenset",
    "kind": 1,
    "insertText": "frozenset(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Create immutable set",
    "sortText": "33_frozenset"
  },
  {
    "label": "hex",
    "kind": 1,
    "insertText": "hex(${1:x})",
    "insertTextRules": 4,
    "documentation": "Convert to hexadecimal",
    "sortText": "34_hex"
  },
  {
    "label": "oct",
    "kind": 1,
    "insertText": "oct(${1:x})",
    "insertTextRules": 4,
    "documentation": "Convert to octal",
    "sortText": "35_oct"
  },
  {
    "label": "bin",
    "kind": 1,
    "insertText": "bin(${1:x})",
    "insertTextRules": 4,
    "documentation": "Convert to binary",
    "sortText": "36_bin"
  },
  {
    "label": "chr",
    "kind": 1,
    "insertText": "chr(${1:i})",
    "insertTextRules": 4,
    "documentation": "Convert integer to character",
    "sortText": "37_chr"
  },
  {
    "label": "ord",
    "kind": 1,
    "insertText": "ord(${1:c})",
    "insertTextRules": 4,
    "documentation": "Convert character to integer",
    "sortText": "38_ord"
  },
  {
    "label": "hasattr",
    "kind": 1,
    "insertText": "hasattr(${1:obj, name})",
    "insertTextRules": 4,
    "documentation": "Check if object has attribute",
    "sortText": "39_hasattr"
  },
  {
    "label": "getattr",
    "kind": 1,
    "insertText": "getattr(${1:obj, name})",
    "insertTextRules": 4,
    "documentation": "Get object attribute",
    "sortText": "40_getattr"
  },
  {
    "label": "setattr",
    "kind": 1,
    "insertText": "setattr(${1:obj, name, value})",
    "insertTextRules": 4,
    "documentation": "Set object attribute",
    "sortText": "41_setattr"
  },
  {
    "label": "callable",
    "kind": 1,
    "insertText": "callable(${1:obj})",
    "insertTextRules": 4,
    "documentation": "Check if object is callable",
    "sortText": "42_callable"
  },
  {
    "label": "super",
    "kind": 1,
    "insertText": "super",
    "documentation": "Access parent class",
    "sortText": "43_super"
  },
  {
    "label": "next",
    "kind": 1,
    "insertText": "next(${1:iterator})",
    "insertTextRules": 4,
    "documentation": "Get next item from iterator",
    "sortText": "44_next"
  },
  {
    "label": "iter",
    "kind": 1,
    "insertText": "iter(${1:iterable})",
    "insertTextRules": 4,
    "documentation": "Create iterator",
    "sortText": "45_iter"
  },
  {
    "label": "repr",
    "kind": 1,
    "insertText": "repr(${1:obj})",
    "insertTextRules": 4,
    "documentation": "Get string representation",
    "sortText": "46_repr"
  },
  {
    "label": "format",
    "kind": 1,
    "insertText": "format(${1:value, format_spec})",
    "insertTextRules": 4,
    "documentation": "Format value",
    "sortText": "47_format"
  },
  {
    "label": "divmod",
    "kind": 1,
    "insertText": "divmod(${1:a, b})",
    "insertTextRules": 4,
    "documentation": "Division and remainder",
    "sortText": "48_divmod"
  },
  {
    "label": "id",
    "kind": 1,
    "insertText": "id(${1:obj})",
    "insertTextRules": 4,
    "documentation": "Get object identity",
    "sortText": "49_id"
  },
  {
    "label": "hash",
    "kind": 1,
    "insertText": "hash(${1:obj})",
    "insertTextRules": 4,
    "documentation": "Get object hash",
    "sortText": "50_hash"
  },
  {
    "label": "dir",
    "kind": 1,
    "insertText": "dir(${1:obj})",
    "insertTextRules": 4,
    "documentation": "List object attributes",
    "sortText": "51_dir"
  },
  {
    "label": "issubclass",
    "kind": 1,
    "insertText": "issubclass(${1:cls, classinfo})",
    "insertTextRules": 4,
    "documentation": "Check class hierarchy",
    "sortText": "52_issubclass"
  },
  // Constants
  {
    "label": "True",
    "kind": 22,
    "insertText": "True",
    "insertTextRules": 4,
    "documentation": "Boolean true value",
    "sortText": "53_True"
  },
  {
    "label": "False",
    "kind": 22,
    "insertText": "False",
    "insertTextRules": 4,
    "documentation": "Boolean false value",
    "sortText": "54_False"
  },
  {
    "label": "None",
    "kind": 22,
    "insertText": "None",
    "insertTextRules": 4,
    "documentation": "Null/None value",
    "sortText": "55_None"
  },
  // Exceptions
  {
    "label": "ValueError",
    "kind": 22,
    "insertText": "ValueError",
    "insertTextRules": 4,
    "documentation": "Invalid argument value",
    "sortText": "56_ValueError"
  },
  {
    "label": "TypeError",
    "kind": 22,
    "insertText": "TypeError",
    "insertTextRules": 4,
    "documentation": "Invalid argument type",
    "sortText": "57_TypeError"
  },
  {
    "label": "KeyError",
    "kind": 22,
    "insertText": "KeyError",
    "insertTextRules": 4,
    "documentation": "Dictionary key not found",
    "sortText": "58_KeyError"
  },
  {
    "label": "IndexError",
    "kind": 22,
    "insertText": "IndexError",
    "insertTextRules": 4,
    "documentation": "Index out of range",
    "sortText": "59_IndexError"
  },
  {
    "label": "AttributeError",
    "kind": 22,
    "insertText": "AttributeError",
    "insertTextRules": 4,
    "documentation": "Attribute not found",
    "sortText": "60_AttributeError"
  },
  {
    "label": "NameError",
    "kind": 22,
    "insertText": "NameError",
    "insertTextRules": 4,
    "documentation": "Name not defined",
    "sortText": "61_NameError"
  },
  {
    "label": "RuntimeError",
    "kind": 22,
    "insertText": "RuntimeError",
    "insertTextRules": 4,
    "documentation": "Generic runtime error",
    "sortText": "62_RuntimeError"
  },
  {
    "label": "NotImplementedError",
    "kind": 22,
    "insertText": "NotImplementedError",
    "insertTextRules": 4,
    "documentation": "Method not implemented",
    "sortText": "63_NotImplementedError"
  },
  {
    "label": "FileNotFoundError",
    "kind": 22,
    "insertText": "FileNotFoundError",
    "insertTextRules": 4,
    "documentation": "File not found",
    "sortText": "64_FileNotFoundError"
  },
  {
    "label": "PermissionError",
    "kind": 22,
    "insertText": "PermissionError",
    "insertTextRules": 4,
    "documentation": "Permission denied",
    "sortText": "65_PermissionError"
  },
  {
    "label": "ZeroDivisionError",
    "kind": 22,
    "insertText": "ZeroDivisionError",
    "insertTextRules": 4,
    "documentation": "Division by zero",
    "sortText": "66_ZeroDivisionError"
  },
  // Popular packages from PyPI
  {
    "label": "numpy",
    "kind": 1,
    "insertText": "import numpy",
    "insertTextRules": 4,
    "documentation": "Fundamental package for array computing in Python",
    "sortText": "67_numpy"
  },
  {
    "label": "pandas",
    "kind": 1,
    "insertText": "import pandas",
    "insertTextRules": 4,
    "documentation": "Powerful data structures for data analysis, time series, and statistics",
    "sortText": "68_pandas"
  },
  {
    "label": "requests",
    "kind": 1,
    "insertText": "import requests",
    "insertTextRules": 4,
    "documentation": "Python HTTP for Humans.",
    "sortText": "69_requests"
  },
  {
    "label": "matplotlib",
    "kind": 1,
    "insertText": "import matplotlib",
    "insertTextRules": 4,
    "documentation": "Python plotting package",
    "sortText": "70_matplotlib"
  },
  {
    "label": "scikit-learn",
    "kind": 1,
    "insertText": "import scikit_learn",
    "insertTextRules": 4,
    "documentation": "A set of python modules for machine learning and data mining",
    "sortText": "71_scikit-learn"
  },
  {
    "label": "tensorflow",
    "kind": 1,
    "insertText": "import tensorflow",
    "insertTextRules": 4,
    "documentation": "TensorFlow is an open source machine learning framework for everyone.",
    "sortText": "72_tensorflow"
  },
  {
    "label": "pytorch",
    "kind": 1,
    "insertText": "import pytorch",
    "insertTextRules": 4,
    "documentation": "pytorch - PyPI package",
    "sortText": "73_pytorch"
  },
  {
    "label": "Django",
    "kind": 1,
    "insertText": "import Django",
    "insertTextRules": 4,
    "documentation": "A high-level Python web framework that encourages rapid development and clean, pragmatic design.",
    "sortText": "74_Django"
  },
  {
    "label": "Flask",
    "kind": 1,
    "insertText": "import Flask",
    "insertTextRules": 4,
    "documentation": "A simple framework for building complex web applications.",
    "sortText": "75_Flask"
  },
  {
    "label": "SQLAlchemy",
    "kind": 1,
    "insertText": "import SQLAlchemy",
    "insertTextRules": 4,
    "documentation": "Database Abstraction Library",
    "sortText": "76_SQLAlchemy"
  },
  {
    "label": "beautifulsoup4",
    "kind": 1,
    "insertText": "import beautifulsoup4",
    "insertTextRules": 4,
    "documentation": "Screen-scraping library",
    "sortText": "77_beautifulsoup4"
  },
  {
    "label": "selenium",
    "kind": 1,
    "insertText": "import selenium",
    "insertTextRules": 4,
    "documentation": "Official Python bindings for Selenium WebDriver",
    "sortText": "78_selenium"
  },
  {
    "label": "pillow",
    "kind": 1,
    "insertText": "import pillow",
    "insertTextRules": 4,
    "documentation": "Python Imaging Library (fork)",
    "sortText": "79_pillow"
  },
  {
    "label": "opencv-python",
    "kind": 1,
    "insertText": "import opencv_python",
    "insertTextRules": 4,
    "documentation": "Wrapper package for OpenCV python bindings.",
    "sortText": "80_opencv-python"
  },
  {
    "label": "scipy",
    "kind": 1,
    "insertText": "import scipy",
    "insertTextRules": 4,
    "documentation": "Fundamental algorithms for scientific computing in Python",
    "sortText": "81_scipy"
  },
  {
    "label": "pytest",
    "kind": 1,
    "insertText": "import pytest",
    "insertTextRules": 4,
    "documentation": "pytest: simple powerful testing with Python",
    "sortText": "82_pytest"
  },
  {
    "label": "boto3",
    "kind": 1,
    "insertText": "import boto3",
    "insertTextRules": 4,
    "documentation": "The AWS SDK for Python",
    "sortText": "83_boto3"
  },
  {
    "label": "redis",
    "kind": 1,
    "insertText": "import redis",
    "insertTextRules": 4,
    "documentation": "Python client for Redis database and key-value store",
    "sortText": "84_redis"
  },
  {
    "label": "celery",
    "kind": 1,
    "insertText": "import celery",
    "insertTextRules": 4,
    "documentation": "Distributed Task Queue.",
    "sortText": "85_celery"
  },
  {
    "label": "fastapi",
    "kind": 1,
    "insertText": "import fastapi",
    "insertTextRules": 4,
    "documentation": "FastAPI framework, high performance, easy to learn, fast to code, ready for production",
    "sortText": "86_fastapi"
  },
  // Keywords
  {
    "label": "def",
    "kind": 14,
    "insertText": "def ${1:function_name}(${2:args}):\n\t${3:pass}",
    "insertTextRules": 4,
    "documentation": "Define a function",
    "sortText": "87_def"
  },
  {
    "label": "class",
    "kind": 14,
    "insertText": "class ${1:ClassName}:\n\tdef __init__(self, ${2:args}):\n\t\t${3:pass}",
    "insertTextRules": 4,
    "documentation": "Define a class",
    "sortText": "88_class"
  },
  {
    "label": "if",
    "kind": 14,
    "insertText": "if ${1:condition}:\n\t${2:pass}",
    "insertTextRules": 4,
    "documentation": "Conditional block",
    "sortText": "89_if"
  },
  {
    "label": "elif",
    "kind": 14,
    "insertText": "elif ${1:condition}:\n\t${2:pass}",
    "insertTextRules": 4,
    "documentation": "Else if block",
    "sortText": "90_elif"
  },
  {
    "label": "else",
    "kind": 14,
    "insertText": "else:\n\t${1:pass}",
    "insertTextRules": 4,
    "documentation": "Else block",
    "sortText": "91_else"
  },
  {
    "label": "for",
    "kind": 14,
    "insertText": "for ${1:item} in ${2:iterable}:\n\t${3:pass}",
    "insertTextRules": 4,
    "documentation": "For loop",
    "sortText": "92_for"
  },
  {
    "label": "while",
    "kind": 14,
    "insertText": "while ${1:condition}:\n\t${2:pass}",
    "insertTextRules": 4,
    "documentation": "While loop",
    "sortText": "93_while"
  },
  {
    "label": "return",
    "kind": 14,
    "insertText": "return ${1:value}",
    "insertTextRules": 4,
    "documentation": "Return from function",
    "sortText": "94_return"
  },
  {
    "label": "break",
    "kind": 14,
    "insertText": "break",
    "insertTextRules": 4,
    "documentation": "Break from loop",
    "sortText": "95_break"
  },
  {
    "label": "continue",
    "kind": 14,
    "insertText": "continue",
    "insertTextRules": 4,
    "documentation": "Continue to next iteration",
    "sortText": "96_continue"
  },
  {
    "label": "import",
    "kind": 14,
    "insertText": "import ${1:module}",
    "insertTextRules": 4,
    "documentation": "Import a module",
    "sortText": "97_import"
  },
  {
    "label": "from",
    "kind": 14,
    "insertText": "from ${1:module} import ${2:name}",
    "insertTextRules": 4,
    "documentation": "Import specific items from module",
    "sortText": "98_from"
  },
  {
    "label": "as",
    "kind": 14,
    "insertText": "as ",
    "insertTextRules": 4,
    "documentation": "Create an alias",
    "sortText": "99_as"
  },
  {
    "label": "try",
    "kind": 14,
    "insertText": "try:\n\t${1:pass}\nexcept ${2:Exception}:\n\t${3:pass}",
    "insertTextRules": 4,
    "documentation": "Try-except block",
    "sortText": "100_try"
  },
  {
    "label": "except",
    "kind": 14,
    "insertText": "except ${1:Exception}:\n\t${2:pass}",
    "insertTextRules": 4,
    "documentation": "Catch exceptions",
    "sortText": "101_except"
  },
  {
    "label": "finally",
    "kind": 14,
    "insertText": "finally:\n\t${1:pass}",
    "insertTextRules": 4,
    "documentation": "Final block",
    "sortText": "102_finally"
  },
  {
    "label": "raise",
    "kind": 14,
    "insertText": "raise ${1:Exception}",
    "insertTextRules": 4,
    "documentation": "Raise an exception",
    "sortText": "103_raise"
  },
  {
    "label": "with",
    "kind": 14,
    "insertText": "with ${1:context} as ${2:var}:\n\t${3:pass}",
    "insertTextRules": 4,
    "documentation": "Context manager",
    "sortText": "104_with"
  },
  {
    "label": "lambda",
    "kind": 14,
    "insertText": "lambda ${1:args}: ${2:expr}",
    "insertTextRules": 4,
    "documentation": "Anonymous function",
    "sortText": "105_lambda"
  },
  {
    "label": "pass",
    "kind": 14,
    "insertText": "pass",
    "insertTextRules": 4,
    "documentation": "No-op statement",
    "sortText": "106_pass"
  },
  {
    "label": "assert",
    "kind": 14,
    "insertText": "assert ${1:condition}, ${2:message}",
    "insertTextRules": 4,
    "documentation": "Assert condition",
    "sortText": "107_assert"
  },
];
