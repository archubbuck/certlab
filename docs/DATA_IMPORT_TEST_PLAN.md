# Data Import Feature - Manual Test Plan

## Overview
This document provides a comprehensive test plan for validating the data import feature of CertLab. The tests focus on UI functionality, user workflows, error handling, and edge cases as specified in the acceptance criteria.

## Prerequisites
- User must have admin role in Firebase (`role: 'admin'` in `/users/{userId}` document)
- Firebase/Firestore must be properly configured and accessible
- Sample YAML files must be available in `client/public/data/`:
  - `cissp-questions.yaml`
  - `cism-questions.yaml`

## Test Environment Setup
1. Start the development server: `npm run dev`
2. Navigate to: `http://localhost:5000/data-import`
3. Ensure you are logged in with an admin account

---

## Test Suite 1: Admin Access Control

### Test 1.1: Non-Admin User Access
**Description**: Verify that non-admin users see appropriate access denied message

**Steps**:
1. Log in with a non-admin user account
2. Navigate to `/data-import`

**Expected Results**:
- ✓ Red alert box with "Admin Access Required" title displayed
- ✓ Message explains data import is restricted to administrators
- ✓ Instructions provided for enabling admin access via Firestore
- ✓ No import buttons or functionality visible
- ✓ Shield icon displayed in alert

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 1.2: Admin User Access
**Description**: Verify that admin users can access all import functionality

**Steps**:
1. Log in with an admin user account
2. Navigate to `/data-import`

**Expected Results**:
- ✓ Page title "Data Import" displayed
- ✓ Description explaining import functionality
- ✓ Alert with information about sample data visible
- ✓ Two category cards visible (CISSP and CISM)
- ✓ Custom file upload card visible
- ✓ All import and clear buttons enabled

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

## Test Suite 2: CISSP Bundled Data Import

### Test 2.1: Basic CISSP Import
**Description**: Import CISSP sample data with no existing questions

**Prerequisites**: 
- Clear any existing CISSP questions using "Clear" button first

**Steps**:
1. Ensure admin access
2. Navigate to `/data-import`
3. Click "Import Sample Data" button on CISSP card

**Expected Results**:
- ✓ Button shows "Importing..." with spinner icon during import
- ✓ Progress bar appears showing percentage (0-100%)
- ✓ Progress status text updates (e.g., "Importing questions 1-50 of 500...")
- ✓ Success toast notification appears with message like "Imported 500 questions for CISSP"
- ✓ Green success alert displayed on card
- ✓ Alert shows:
  - "✓ 500 questions imported" (or similar count)
  - "✓ 1 categories created" (if new)
  - "✓ N subcategories created" (number of subcategories)
- ✓ Import completes without errors

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Questions Imported: _____
- Categories Created: _____
- Subcategories Created: _____
- Duration: _____ seconds
- Notes: _______________

---

### Test 2.2: Re-import CISSP Data (Existing Category)
**Description**: Import CISSP data when category already exists

**Prerequisites**: 
- Complete Test 2.1 first (CISSP category and questions exist)

**Steps**:
1. Click "Import Sample Data" button on CISSP card again

**Expected Results**:
- ✓ Import completes successfully
- ✓ Success alert shows "✓ N questions imported"
- ✓ Alert shows "0 categories created" (category already exists)
- ✓ Subcategories count may be 0 or N depending on existing data
- ✓ Duplicate questions may be created (this is expected behavior)

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Questions Imported: _____
- Categories Created: _____
- Subcategories Created: _____
- Notes: _______________

---

### Test 2.3: Progress Callback Validation
**Description**: Verify progress updates during CISSP import

**Steps**:
1. Clear existing CISSP questions
2. Click "Import Sample Data" on CISSP card
3. Observe progress indicator closely

**Expected Results**:
- ✓ Progress bar starts at 0%
- ✓ Progress text shows initial status: "Validating and preparing to import..."
- ✓ Progress text updates during batch processing: "Importing questions 1-50 of 500...", "Importing questions 51-100 of 500...", etc.
- ✓ Progress bar fills smoothly to 100%
- ✓ Final status message displayed: "Successfully imported N questions for CISSP!"
- ✓ Progress indicator disappears when complete

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Progress Updates Observed: _____
- Notes: _______________

---

## Test Suite 3: CISM Bundled Data Import

### Test 3.1: Basic CISM Import
**Description**: Import CISM sample data

**Prerequisites**: 
- Clear any existing CISM questions

**Steps**:
1. Click "Import Sample Data" button on CISM card

**Expected Results**:
- ✓ Import completes successfully
- ✓ Success toast: "Imported N questions for CISM"
- ✓ Success alert with import statistics
- ✓ Category created with icon "briefcase" (not "shield")
- ✓ All questions imported without errors

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Questions Imported: _____
- Categories Created: _____
- Subcategories Created: _____
- Notes: _______________

---

## Test Suite 4: Custom File Upload

### Test 4.1: Valid YAML File Upload
**Description**: Upload a custom YAML file with valid structure

**Test File** (`test-valid.yaml`):
```yaml
category: TestCategory
description: Test questions for validation
questions:
  - text: "What is the capital of France?"
    options:
      - id: 0
        text: "London"
      - id: 1
        text: "Paris"
      - id: 2
        text: "Berlin"
    correctAnswer: 1
    explanation: "Paris is the capital of France"
    difficultyLevel: 1
    tags: ["geography", "easy"]
    subcategory: "European Capitals"
  - text: "What is 2 + 2?"
    options:
      - id: 0
        text: "3"
      - id: 1
        text: "4"
      - id: 2
        text: "5"
    correctAnswer: 1
    explanation: "Basic arithmetic"
    difficultyLevel: 1
    tags: ["math"]
    subcategory: "Arithmetic"
```

**Steps**:
1. Create the test file above
2. Click "Choose YAML File" button in "Upload Custom YAML File" card
3. Select the test file
4. Wait for import to complete

**Expected Results**:
- ✓ File picker dialog opens
- ✓ After selection, import starts automatically
- ✓ Progress indicator shows during upload
- ✓ Success toast: "Imported 2 questions from test-valid.yaml"
- ✓ Success alert shows:
  - "✓ 2 questions imported"
  - "✓ 1 categories created"
  - "✓ 2 subcategories created"
- ✓ File input is reset (can select another file)

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Questions Imported: _____
- Notes: _______________

---

### Test 4.2: Invalid YAML Structure - Missing Category
**Description**: Upload YAML file without required category field

**Test File** (`test-no-category.yaml`):
```yaml
description: Missing category field
questions:
  - text: "Question?"
    options:
      - id: 0
        text: "A"
      - id: 1
        text: "B"
    correctAnswer: 0
    explanation: "Explanation"
    difficultyLevel: 1
    tags: []
    subcategory: "Test"
```

**Steps**:
1. Create the test file above
2. Upload the file

**Expected Results**:
- ✓ Red failure alert appears on card
- ✓ Alert title: "Import Failed"
- ✓ Error message: "Failed to parse YAML: Invalid YAML structure: must contain category and questions array"
- ✓ Destructive (red) toast notification with error
- ✓ No questions imported (count = 0)

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Error Message: _______________
- Notes: _______________

---

### Test 4.3: Invalid YAML Structure - Missing Questions Array
**Description**: Upload YAML file without questions array

**Test File** (`test-no-questions.yaml`):
```yaml
category: TestCategory
description: Missing questions array
```

**Steps**:
1. Upload the file

**Expected Results**:
- ✓ Red failure alert
- ✓ Error contains: "must contain category and questions array"
- ✓ No questions imported

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 4.4: Invalid YAML Syntax
**Description**: Upload file with malformed YAML syntax

**Test File** (`test-invalid-syntax.yaml`):
```yaml
category: TestCategory
questions: [invalid yaml syntax {{{
```

**Steps**:
1. Upload the file

**Expected Results**:
- ✓ Red failure alert
- ✓ Error contains: "Failed to parse YAML"
- ✓ Destructive toast notification
- ✓ No questions imported

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 4.5: Invalid Question - Missing correctAnswer Match
**Description**: Upload YAML where correctAnswer doesn't match any option ID

**Test File** (`test-invalid-answer.yaml`):
```yaml
category: TestCategory
questions:
  - text: "Valid question?"
    options:
      - id: 0
        text: "A"
      - id: 1
        text: "B"
    correctAnswer: 0
    explanation: "Explanation"
    difficultyLevel: 1
    tags: []
    subcategory: "Test"
  - text: "Invalid question?"
    options:
      - id: 0
        text: "A"
      - id: 1
        text: "B"
    correctAnswer: 5
    explanation: "Explanation"
    difficultyLevel: 1
    tags: []
    subcategory: "Test"
```

**Steps**:
1. Upload the file

**Expected Results**:
- ✓ Import completes with partial success
- ✓ Success alert shows:
  - "✓ 1 questions imported"
  - "✓ 1 categories created"
  - "✓ 1 subcategories created"
- ✓ Success alert also shows errors:
  - "• Question 2: correctAnswer 5 does not match any option ID. Valid IDs: 0, 1"
- ✓ Toast shows success with count of imported questions

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Questions Imported: _____
- Questions Skipped: _____
- Notes: _______________

---

### Test 4.6: Invalid Question - Too Few Options
**Description**: Upload YAML with question having less than 2 options

**Test File** (`test-few-options.yaml`):
```yaml
category: TestCategory
questions:
  - text: "Only one option?"
    options:
      - id: 0
        text: "Only option"
    correctAnswer: 0
    explanation: "Explanation"
    difficultyLevel: 1
    tags: []
    subcategory: "Test"
```

**Steps**:
1. Upload the file

**Expected Results**:
- ✓ Import completes but skips invalid question
- ✓ Success alert shows "✓ 0 questions imported"
- ✓ Error message: "Question 1: Invalid options structure - Too small: expected array to have >=2 items"
- ✓ Categories and subcategories may still be created

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 4.7: Edge Case - Maximum Options (10)
**Description**: Upload question with maximum allowed options

**Test File** (`test-max-options.yaml`):
```yaml
category: TestCategory
questions:
  - text: "Question with 10 options?"
    options:
      - id: 0
        text: "Option 0"
      - id: 1
        text: "Option 1"
      - id: 2
        text: "Option 2"
      - id: 3
        text: "Option 3"
      - id: 4
        text: "Option 4"
      - id: 5
        text: "Option 5"
      - id: 6
        text: "Option 6"
      - id: 7
        text: "Option 7"
      - id: 8
        text: "Option 8"
      - id: 9
        text: "Option 9"
    correctAnswer: 5
    explanation: "Testing maximum options"
    difficultyLevel: 3
    tags: ["edge-case", "max-options"]
    subcategory: "Edge Cases"
```

**Steps**:
1. Upload the file

**Expected Results**:
- ✓ Import succeeds
- ✓ Question imported with all 10 options
- ✓ No validation errors

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 4.8: Edge Case - Missing Tags
**Description**: Upload question without tags array

**Test File** (`test-no-tags.yaml`):
```yaml
category: TestCategory
questions:
  - text: "Question without tags?"
    options:
      - id: 0
        text: "A"
      - id: 1
        text: "B"
    correctAnswer: 0
    explanation: "Explanation"
    difficultyLevel: 1
    tags: []
    subcategory: "Test"
```

**Steps**:
1. Upload the file

**Expected Results**:
- ✓ Import succeeds
- ✓ Question imported with empty tags array
- ✓ No validation errors

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 4.9: Edge Case - Empty Explanation
**Description**: Upload question with empty explanation field

**Test File** (`test-empty-explanation.yaml`):
```yaml
category: TestCategory
questions:
  - text: "Question without explanation?"
    options:
      - id: 0
        text: "A"
      - id: 1
        text: "B"
    correctAnswer: 0
    explanation: ""
    difficultyLevel: 1
    tags: []
    subcategory: "Test"
```

**Steps**:
1. Upload the file

**Expected Results**:
- ✓ Import succeeds
- ✓ Question imported with empty explanation
- ✓ No validation errors

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 4.10: Edge Case - High Difficulty Level
**Description**: Upload question with high difficulty level (5)

**Test File** (`test-high-difficulty.yaml`):
```yaml
category: TestCategory
questions:
  - text: "Very difficult question?"
    options:
      - id: 0
        text: "A"
      - id: 1
        text: "B"
    correctAnswer: 1
    explanation: "This is a very difficult question"
    difficultyLevel: 5
    tags: ["advanced", "expert"]
    subcategory: "Advanced Topics"
```

**Steps**:
1. Upload the file

**Expected Results**:
- ✓ Import succeeds
- ✓ Question imported with difficulty level 5
- ✓ No validation errors

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

## Test Suite 5: Clear Category Function

### Test 5.1: Clear CISSP Questions
**Description**: Clear all questions from CISSP category

**Prerequisites**:
- CISSP questions must exist (run Test 2.1 if needed)

**Steps**:
1. Click "Clear" button on CISSP card
2. Observe confirmation dialog

**Expected Results**:
- ✓ Alert dialog appears with:
  - Title: "Clear CISSP Questions"
  - Message: "Are you sure you want to delete all CISSP questions? This action cannot be undone..."
  - "Cancel" button
  - "Delete All Questions" button (destructive red style)
- ✓ Click "Delete All Questions"
- ✓ Toast notification: "Deleted N questions from CISSP"
- ✓ Dialog closes
- ✓ Questions are removed from database

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Questions Deleted: _____
- Notes: _______________

---

### Test 5.2: Clear - Cancel Dialog
**Description**: Test canceling the clear operation

**Steps**:
1. Click "Clear" button
2. Click "Cancel" in the dialog

**Expected Results**:
- ✓ Dialog closes
- ✓ No questions deleted
- ✓ No toast notification
- ✓ Questions remain in database

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 5.3: Clear - Non-Existent Category
**Description**: Clear category that has no questions

**Steps**:
1. Ensure a category has no questions
2. Click "Clear" button for that category
3. Confirm deletion

**Expected Results**:
- ✓ Toast notification: "Deleted 0 questions from [CategoryName]"
- ✓ No errors occur

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 5.4: Clear Before Re-import
**Description**: Verify clear function prevents duplicates

**Steps**:
1. Import CISSP sample data (Test 2.1)
2. Note the number of questions
3. Clear CISSP questions (Test 5.1)
4. Re-import CISSP sample data
5. Verify question count

**Expected Results**:
- ✓ After clear: 0 questions in CISSP
- ✓ After re-import: Same question count as initial import
- ✓ No duplicate questions created

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Initial Count: _____
- After Clear: _____
- After Re-import: _____
- Notes: _______________

---

## Test Suite 6: Error Handling & Edge Cases

### Test 6.1: Network Error During Bundled Import
**Description**: Simulate network failure during bundled YAML fetch

**Steps**:
1. Disable network connectivity or use browser DevTools to block network
2. Click "Import Sample Data" on CISSP card

**Expected Results**:
- ✓ Red failure alert appears
- ✓ Error message indicates network failure (e.g., "Failed to load CISSP questions: Failed to fetch")
- ✓ Destructive toast notification
- ✓ No questions imported

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Error Message: _______________
- Notes: _______________

---

### Test 6.2: Multiple Subcategories Creation
**Description**: Verify proper handling of multiple unique subcategories

**Test File** (`test-multiple-subcategories.yaml`):
```yaml
category: TestCategory
questions:
  - text: "Question 1"
    options:
      - id: 0
        text: "A"
      - id: 1
        text: "B"
    correctAnswer: 0
    explanation: "Explanation"
    difficultyLevel: 1
    tags: []
    subcategory: "Subcategory A"
  - text: "Question 2"
    options:
      - id: 0
        text: "A"
      - id: 1
        text: "B"
    correctAnswer: 1
    explanation: "Explanation"
    difficultyLevel: 1
    tags: []
    subcategory: "Subcategory B"
  - text: "Question 3"
    options:
      - id: 0
        text: "A"
      - id: 1
        text: "B"
    correctAnswer: 0
    explanation: "Explanation"
    difficultyLevel: 1
    tags: []
    subcategory: "Subcategory A"
  - text: "Question 4"
    options:
      - id: 0
        text: "A"
      - id: 1
        text: "B"
    correctAnswer: 1
    explanation: "Explanation"
    difficultyLevel: 1
    tags: []
    subcategory: "Subcategory C"
```

**Steps**:
1. Upload the file

**Expected Results**:
- ✓ Import succeeds
- ✓ Success alert shows:
  - "✓ 4 questions imported"
  - "✓ 1 categories created"
  - "✓ 3 subcategories created" (A, B, C - only unique ones)
- ✓ All questions properly linked to correct subcategories

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Subcategories Created: _____
- Notes: _______________

---

### Test 6.3: Large File Import (Batch Processing)
**Description**: Verify batch processing works with 100+ questions

**Note**: Create a YAML file with 100+ questions for this test, or use the bundled CISSP/CISM files which have 500 questions.

**Steps**:
1. Import CISSP sample data (500 questions)
2. Monitor progress updates

**Expected Results**:
- ✓ Import completes successfully
- ✓ Progress updates show batches: "Importing questions 1-50...", "51-100...", etc.
- ✓ All 500 questions imported
- ✓ No timeout or performance issues
- ✓ Batch size of 50 questions per batch used

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Questions Imported: _____
- Duration: _____ seconds
- Batch Updates Observed: _____
- Notes: _______________

---

### Test 6.4: Concurrent Imports
**Description**: Attempt to import multiple categories simultaneously

**Steps**:
1. Click "Import Sample Data" on CISSP card
2. Immediately click "Import Sample Data" on CISM card (while CISSP is importing)

**Expected Results**:
- ✓ Both imports proceed
- ✓ Progress indicators shown for both cards
- ✓ Both imports complete successfully
- ✓ No data corruption or conflicts
- ✓ Success toasts for both imports

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 6.5: File Type Validation
**Description**: Attempt to upload non-YAML file

**Steps**:
1. Try to select a .txt, .json, or other non-YAML file
2. Observe file picker

**Expected Results**:
- ✓ File picker only shows/allows .yaml and .yml files
- ✓ If non-YAML file is somehow selected, validation error occurs

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

## Test Suite 7: UI/UX Validation

### Test 7.1: Responsive Design
**Description**: Verify UI works on different screen sizes

**Steps**:
1. Resize browser window to mobile, tablet, and desktop sizes
2. Observe layout changes

**Expected Results**:
- ✓ Mobile (320-768px): Cards stack vertically
- ✓ Tablet (768-1024px): Responsive grid layout
- ✓ Desktop (1024+px): Two-column grid for category cards
- ✓ All buttons and text remain readable
- ✓ Progress bars scale appropriately

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 7.2: Loading States
**Description**: Verify loading indicators work correctly

**Steps**:
1. Start any import operation
2. Observe UI during import

**Expected Results**:
- ✓ Button text changes to "Importing..."
- ✓ Spinner icon displayed in button
- ✓ Button is disabled during import
- ✓ Clear button is disabled during import
- ✓ Progress bar visible and animating
- ✓ Progress percentage updates smoothly

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 7.3: Toast Notifications
**Description**: Verify toast notifications display correctly

**Steps**:
1. Perform various import operations (success and failure)
2. Observe toast notifications

**Expected Results**:
- ✓ Success toasts: Default (non-destructive) styling
- ✓ Error toasts: Destructive (red) styling
- ✓ Toasts appear in consistent location (typically top-right or bottom)
- ✓ Toasts auto-dismiss after a few seconds
- ✓ Multiple toasts stack properly
- ✓ Toast messages are clear and specific

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

### Test 7.4: Alert Card Display
**Description**: Verify result alerts display correctly

**Steps**:
1. Perform successful import
2. Perform failed import
3. Observe alert cards

**Expected Results**:
- ✓ Success alert: Green checkmark icon, default styling
- ✓ Failure alert: Red X icon, destructive styling
- ✓ Success alert shows breakdown of import statistics
- ✓ Failure alert shows error messages (bullet points)
- ✓ Alerts remain visible until next import operation

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Notes: _______________

---

## Test Suite 8: Data Validation

### Test 8.1: Verify Category Creation
**Description**: Confirm categories are properly created in Firestore

**Steps**:
1. Clear all data from Firestore
2. Import CISSP sample data
3. Check Firestore database

**Expected Results**:
- ✓ New document created in `categories` collection
- ✓ Category document contains:
  - `name`: "CISSP"
  - `description`: "Certified Information Systems Security Professional..."
  - `icon`: "shield"
  - `tenantId`: 1
- ✓ Category ID is auto-generated

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Category ID: _____
- Notes: _______________

---

### Test 8.2: Verify Subcategory Creation
**Description**: Confirm subcategories are properly created

**Steps**:
1. Import custom YAML with multiple subcategories
2. Check Firestore database

**Expected Results**:
- ✓ New documents created in `subcategories` collection
- ✓ Each subcategory document contains:
  - `name`: (subcategory name)
  - `description`: "(name) domain questions"
  - `categoryId`: (references parent category)
  - `tenantId`: 1
- ✓ Correct number of subcategories created

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Subcategories Found: _____
- Notes: _______________

---

### Test 8.3: Verify Question Creation
**Description**: Confirm questions are properly stored

**Steps**:
1. Import a known set of questions
2. Check Firestore database

**Expected Results**:
- ✓ New documents created in `questions` collection
- ✓ Each question document contains:
  - `text`: (question text)
  - `options`: (array of option objects with id and text)
  - `correctAnswer`: (number matching an option id)
  - `explanation`: (explanation text)
  - `difficultyLevel`: (number)
  - `tags`: (array of strings)
  - `categoryId`: (references category)
  - `subcategoryId`: (references subcategory)
  - `tenantId`: 1
- ✓ All fields properly populated

**Actual Results**:
- [ ] Test Passed
- [ ] Test Failed
- Questions Found: _____
- Notes: _______________

---

## Summary

### Test Execution Summary

**Date**: _______________
**Tester**: _______________
**Environment**: Dev / Staging / Production

| Test Suite | Total Tests | Passed | Failed | Notes |
|------------|-------------|--------|--------|-------|
| 1. Admin Access | 2 | ___ | ___ | _____ |
| 2. CISSP Import | 3 | ___ | ___ | _____ |
| 3. CISM Import | 1 | ___ | ___ | _____ |
| 4. Custom Upload | 10 | ___ | ___ | _____ |
| 5. Clear Function | 4 | ___ | ___ | _____ |
| 6. Error Handling | 5 | ___ | ___ | _____ |
| 7. UI/UX | 4 | ___ | ___ | _____ |
| 8. Data Validation | 3 | ___ | ___ | _____ |
| **TOTAL** | **32** | ___ | ___ | _____ |

---

## Known Issues

List any issues discovered during testing:

1. Issue: _____________________
   - Severity: Critical / High / Medium / Low
   - Steps to Reproduce: _____
   - Expected: _____
   - Actual: _____

2. Issue: _____________________
   - Severity: Critical / High / Medium / Low
   - Steps to Reproduce: _____
   - Expected: _____
   - Actual: _____

---

## Recommendations

Based on testing, provide recommendations for:
- Bug fixes needed
- UI/UX improvements
- Performance optimizations
- Additional features
- Documentation updates

---

## Sign-off

**Tester**: _______________
**Date**: _______________
**Status**: Approved / Approved with Issues / Not Approved

**Notes**: _______________________________________________
