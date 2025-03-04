const express = require('express');
const router = express.Router();
const { assessMentalHealth, getPhase2Questions, evaluatePhase2Responses } = require('../controllers/assessmentController');

router.post('/phase1', assessMentalHealth);
router.post('/phase2/questions', getPhase2Questions);
router.post('/phase3/evaluate', evaluatePhase2Responses);

module.exports = router;
