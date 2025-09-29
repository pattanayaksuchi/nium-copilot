#!/usr/bin/env python3
"""
Frontend-Backend Sync Tester
Runs test cases through frontend API to ensure frontend and backend are synchronized.
Only reports scenarios where responses are not in sync or don't match expected shapes.
"""

import asyncio
import csv
import json
import re
import time
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import httpx
import pandas as pd

@dataclass
class TestCase:
    question: str
    expected_response: str
    category: str
    priority: str

@dataclass
class TestResult:
    question: str
    expected: str
    actual: str
    category: str
    priority: str
    passed: bool
    issues: List[str]
    response_time_ms: int

class ResponseMatcher:
    """Fuzzy matching logic for comparing actual vs expected response shapes"""
    
    @staticmethod
    def extract_keywords(text: str) -> set[str]:
        """Extract meaningful keywords from text"""
        # Remove common words and extract meaningful terms
        cleaned = re.sub(r'[^\w\s]', ' ', text.lower())
        words = cleaned.split()
        stopwords = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must'}
        return {w for w in words if len(w) > 2 and w not in stopwords}
    
    @staticmethod
    def check_mandatory_fields_match(expected: str, actual: str) -> tuple[bool, List[str]]:
        """Check if mandatory fields are covered in the response"""
        expected_fields = re.findall(r'\b\w+(?:Number|Code|Name|Address|Id|Type|Amount|Currency|Purpose)\b', expected, re.IGNORECASE)
        issues = []
        
        for field in expected_fields:
            if field.lower() not in actual.lower():
                issues.append(f"Missing expected field: {field}")
        
        # Check for Transfer Money API format if it's a mandatory fields query
        if "mandatory" in expected.lower() or "required" in expected.lower():
            if "Transfer Money API" not in actual:
                issues.append("Missing Transfer Money API format structure")
            if "POST /api/v1/client" not in actual:
                issues.append("Missing proper API endpoint")
        
        return len(issues) == 0, issues
    
    @staticmethod
    def check_proxy_values_match(expected: str, actual: str) -> tuple[bool, List[str]]:
        """Check if proxy values are properly covered"""
        expected_types = re.findall(r'\b[A-Z]{2,}\b', expected)
        issues = []
        
        for proxy_type in expected_types:
            if proxy_type not in actual:
                issues.append(f"Missing proxy type: {proxy_type}")
        
        # Check for country-specific filtering
        if "malaysia" in expected.lower() and ("singapore" in actual.lower() or "india" in actual.lower()):
            issues.append("Response contains other countries when Malaysia was requested")
        
        return len(issues) == 0, issues
    
    @staticmethod  
    def check_api_usage_match(expected: str, actual: str) -> tuple[bool, List[str]]:
        """Check if API usage examples are provided"""
        issues = []
        
        if "POST" in expected and "POST" not in actual:
            issues.append("Missing POST method reference")
        if "GET" in expected and "GET" not in actual:
            issues.append("Missing GET method reference")
        if "Authorization" in expected and "authorization" not in actual.lower():
            issues.append("Missing authorization details")
        if "json" in expected.lower() and "json" not in actual.lower():
            issues.append("Missing JSON format example")
        
        return len(issues) == 0, issues
    
    @staticmethod
    def check_validation_rules_match(expected: str, actual: str) -> tuple[bool, List[str]]:
        """Check if validation rules are properly explained"""
        issues = []
        
        # Look for regex patterns
        regex_patterns = re.findall(r'\^\[.*\]\$|\^\d+\$', expected)
        for pattern in regex_patterns:
            if pattern not in actual:
                issues.append(f"Missing regex pattern: {pattern}")
        
        return len(issues) == 0, issues
    
    @classmethod
    def match_response(cls, test_case: TestCase, actual_response: str) -> tuple[bool, List[str]]:
        """Main matching logic based on category"""
        category = test_case.category.lower()
        expected = test_case.expected_response
        actual = actual_response
        
        if category == "mandatory_fields":
            return cls.check_mandatory_fields_match(expected, actual)
        elif category == "proxy_values": 
            return cls.check_proxy_values_match(expected, actual)
        elif category == "api_usage":
            return cls.check_api_usage_match(expected, actual)
        elif category == "validation_rules":
            return cls.check_validation_rules_match(expected, actual)
        else:
            # Generic keyword matching for other categories
            expected_keywords = cls.extract_keywords(expected)
            actual_keywords = cls.extract_keywords(actual)
            
            missing_keywords = expected_keywords - actual_keywords
            if len(missing_keywords) > len(expected_keywords) * 0.5:  # More than 50% missing
                return False, [f"Missing key concepts: {', '.join(missing_keywords)}"]
            
            return True, []

class FrontendSyncTester:
    def __init__(self, frontend_url: str = "http://localhost:5000"):
        self.frontend_url = frontend_url
        self.api_proxy_url = f"{frontend_url}/api-proxy"
        
    async def create_conversation(self) -> str:
        """Create a new conversation and return the ID"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_proxy_url}/conversations",
                headers={
                    "Content-Type": "application/json",
                    "X-Client-Id": "test-sync-checker"
                },
                json={"title": "Frontend Sync Test"}
            )
            if response.status_code == 200:
                return response.json()["id"]
            else:
                raise Exception(f"Failed to create conversation: {response.status_code}")
    
    async def send_message(self, conversation_id: str, message: str) -> tuple[str, int]:
        """Send message through frontend and return response + time taken"""
        start_time = time.time()
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.api_proxy_url}/conversations/{conversation_id}/messages",
                headers={
                    "Content-Type": "application/json",
                    "X-Client-Id": "test-sync-checker"
                },
                json={"content": message}
            )
            
            end_time = time.time()
            response_time_ms = int((end_time - start_time) * 1000)
            
            if response.status_code == 200:
                data = response.json()
                # Handle frontend response structure: {user_message: {...}, assistant_message: {content: "..."}}
                if "assistant_message" in data and "content" in data["assistant_message"]:
                    return data["assistant_message"]["content"], response_time_ms
                else:
                    return f"ERROR: Unexpected response structure: {data}", response_time_ms
            else:
                return f"ERROR: {response.status_code} - {response.text}", response_time_ms
    
    def load_test_cases(self, csv_path: str) -> List[TestCase]:
        """Load test cases from CSV file"""
        test_cases = []
        with open(csv_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                test_cases.append(TestCase(
                    question=row['question'].strip('"'),
                    expected_response=row['expected_response'],
                    category=row['category'],
                    priority=row['priority']
                ))
        return test_cases
    
    async def run_test_case(self, test_case: TestCase, conversation_id: str) -> TestResult:
        """Run a single test case and return result"""
        try:
            actual_response, response_time = await self.send_message(conversation_id, test_case.question)
            passed, issues = ResponseMatcher.match_response(test_case, actual_response)
            
            return TestResult(
                question=test_case.question,
                expected=test_case.expected_response,
                actual=actual_response,
                category=test_case.category,
                priority=test_case.priority,
                passed=passed,
                issues=issues,
                response_time_ms=response_time
            )
        except Exception as e:
            return TestResult(
                question=test_case.question,
                expected=test_case.expected_response,
                actual=f"ERROR: {str(e)}",
                category=test_case.category,
                priority=test_case.priority,
                passed=False,
                issues=[f"Exception occurred: {str(e)}"],
                response_time_ms=0
            )
    
    async def run_all_tests(self, csv_path: str) -> Dict[str, Any]:
        """Run all test cases and return only failing scenarios"""
        print("Loading test cases...")
        test_cases = self.load_test_cases(csv_path)
        print(f"Loaded {len(test_cases)} test cases")
        
        print("Creating conversation...")
        conversation_id = await self.create_conversation()
        
        print("Running tests...")
        results = []
        failed_results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"Running test {i}/{len(test_cases)}: {test_case.category}")
            result = await self.run_test_case(test_case, conversation_id)
            results.append(result)
            
            if not result.passed:
                failed_results.append({
                    "question": result.question,
                    "expected_response": result.expected,
                    "actual_response": result.actual,
                    "category": result.category,
                    "priority": result.priority,
                    "issues": result.issues,
                    "response_time_ms": result.response_time_ms
                })
            
            # Small delay to avoid overwhelming the system
            await asyncio.sleep(0.5)
        
        # Calculate summary stats
        total_tests = len(results)
        passed_tests = sum(1 for r in results if r.passed)
        failed_tests = total_tests - passed_tests
        
        return {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": f"{(passed_tests/total_tests)*100:.1f}%"
            },
            "failed_scenarios": failed_results,
            "test_completed_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

async def main():
    tester = FrontendSyncTester()
    results = await tester.run_all_tests("test_subset.csv")
    
    # Output JSON results
    print("\n" + "="*80)
    print("FRONTEND-BACKEND SYNC TEST RESULTS")
    print("="*80)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    asyncio.run(main())