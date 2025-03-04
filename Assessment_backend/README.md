# Mental Health Assessment Tool

## **Overview**
This Mental Health Assessment Tool is designed to identify and evaluate potential mental health issues in three phases. The tool assesses multiple mental health conditions by analyzing user responses to specific questions, refining the assessment for top concerns, and performing dynamic validation to ensure accurate recommendations.

### **Key Mental Health Conditions Assessed:**
- Anxiety
- Depression
- Bipolar Disorder
- Obsessive-Compulsive Disorder (OCD)
- Post-Traumatic Stress Disorder (PTSD)
- Attention Deficit Hyperactivity Disorder (ADHD)
- Schizophrenia
- Social Anxiety Disorder

## **Folder Structure**
```
mental-health-assessment/
├── backend/
│   ├── app.js
│   ├── controllers/
│   │   └── assessmentController.js
│   ├── routes/
│   │   └── assessment.js
│   └── package.json
└── frontend/
    └── index.html
```

## **Features**
### **Phase 1: Initial Assessment**
- Evaluates responses to multiple-choice questions.
- Computes the average percentage of symptoms for each mental health problem.
- Identifies the top 3 mental health issues based on the user's responses.

### **Phase 2: Refinement**
- Asks specific follow-up questions for the top 3 detected mental health concerns.
- Ensures more accurate assessment by gathering refined data.

### **Phase 3: Dynamic Validation**
- Dynamically validates the refined assessment.
- Provides recommendations based on refined scores.

## **Getting Started**
### **Backend Setup**
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   ```bash
   node app.js
   ```
   The backend server will run at `http://localhost:3000`.

### **Frontend Setup**
1. Open the `frontend/index.html` file in your web browser.

## **API Endpoints**

### **1. Phase 1: Initial Assessment**
- **Endpoint:** `POST /assess/phase1`
- **Request Body:**
  ```json
  {
    "responses": {
      "restlessness": true,
      "fatigue": false,
      "difficulty concentrating": true,
      "irritability": true
    }
  }
  ```
- **Response:**
  ```json
  {
    "topProblems": [
      { "problem": "anxiety", "percentage": 75 },
      { "problem": "depression", "percentage": 50 }
    ]
  }
  ```

### **2. Phase 2: Refinement Questions**
- **Endpoint:** `POST /assess/phase2/questions`
- **Request Body:**
  ```json
  {
    "topProblems": [
      { "problem": "anxiety" },
      { "problem": "depression" }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "questions": [
      { "problem": "anxiety", "question": "Do you worry excessively?" },
      { "problem": "depression", "question": "Do you feel tired often?" }
    ]
  }
  ```

### **3. Phase 3: Dynamic Validation**
- **Endpoint:** `POST /assess/phase3/evaluate`
- **Request Body:**
  ```json
  {
    "responses": {
      "anxiety": [true, false],
      "depression": [true, true]
    }
  }
  ```
- **Response:**
  ```json
  {
    "refinedScores": {
      "anxiety": 50,
      "depression": 100
    },
    "recommendations": [
      { "problem": "depression", "recommendation": "depression requires further attention." }
    ]
  }
  ```

## **Sample Questions**
### **Phase 1 Questions**
- Anxiety: Do you often feel restless or on edge?
- Depression: Have you lost interest in activities you previously enjoyed?
- Bipolar: Do you experience sudden mood swings from extreme happiness to sadness?

### **Phase 2 Questions (for Refinement)**
- Anxiety: Do you experience sweating or heart palpitations?
- Depression: Do you feel tired often?

### **Phase 3 Dynamic Validation Questions**
- Anxiety: Does the intensity of your anxiety interfere with daily activities?
- Depression: Have you noticed a significant decline in productivity?



