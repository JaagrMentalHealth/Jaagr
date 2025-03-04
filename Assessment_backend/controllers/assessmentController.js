const mentalHealthProblems = {
    anxiety: ['restlessness', 'fatigue', 'difficulty concentrating', 'irritability'],
    depression: ['persistent sadness', 'loss of interest', 'weight changes', 'sleep problems'],
    bipolar: ['mood swings', 'high energy', 'impulsivity', 'sleep disturbance'],
    OCD: ['obsessive thoughts', 'compulsive behavior', 'anxiety from lack of control'],
    PTSD: ['flashbacks', 'nightmares', 'hypervigilance', 'emotional numbness'],
    ADHD: ['inattention', 'hyperactivity', 'impulsivity'],
    schizophrenia: ['delusions', 'hallucinations', 'disorganized speech'],
    socialAnxiety: ['fear of social situations', 'avoidance behavior', 'blushing or sweating']
};

const phase2Questions = {
    anxiety: ["Do you experience sweating or heart palpitations?", "Do you worry excessively?"],
    depression: ["Do you feel tired often?", "Have you lost interest in activities?"],
    OCD: ["Do you have repetitive intrusive thoughts?", "Do you engage in repetitive behaviors?"]
};

// Phase 1: Initial Assessment
const assessMentalHealth = (req, res) => {
    const responses = req.body.responses;
    if (!responses) return res.status(400).send("Responses are required.");

    const scores = {};
    for (const [problem, symptoms] of Object.entries(mentalHealthProblems)) {
        const symptomCount = symptoms.length;
        const positiveResponses = symptoms.filter(symptom => responses[symptom] === true).length;
        scores[problem] = (positiveResponses / symptomCount) * 100;
    }

    const topProblems = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([problem, percentage]) => ({ problem, percentage }));

    res.json({ topProblems });
};

// Phase 2: Refinement Questions
const getPhase2Questions = (req, res) => {
    const { topProblems } = req.body;
    if (!topProblems) return res.status(400).send("Top problems are required.");

    const questions = [];
    topProblems.forEach(({ problem }) => {
        if (phase2Questions[problem]) {
            questions.push(...phase2Questions[problem].map(q => ({ problem, question: q })));
        }
    });

    res.json({ questions });
};

// Phase 3: Dynamic Validation
const evaluatePhase2Responses = (req, res) => {
    const { responses } = req.body;
    if (!responses) return res.status(400).send("Responses are required.");

    const refinedScores = {};
    for (const problem in responses) {
        const answers = responses[problem];
        const positiveCount = answers.filter(Boolean).length;
        refinedScores[problem] = (positiveCount / answers.length) * 100;
    }

    // Dynamic Phase 3 Validation Recommendations
    const recommendations = Object.entries(refinedScores).map(([problem, score]) => {
        return {
            problem,
            recommendation: score > 70 ? `${problem} requires further attention.` : `${problem} appears manageable.`
        };
    });

    res.json({ refinedScores, recommendations });
};

module.exports = { assessMentalHealth, getPhase2Questions, evaluatePhase2Responses };
