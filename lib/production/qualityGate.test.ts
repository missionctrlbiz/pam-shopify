import test from 'node:test';
import assert from 'node:assert';
import { evaluateQualityGateResponse, PASS_THRESHOLD_SCORE, PASS_THRESHOLD_COUNT } from './qualityGateUtils';

test('evaluateQualityGateResponse - Happy Path (Pass)', () => {
    const aiResponse = JSON.stringify({
        score1: 5, score2: 5, score3: 5, score4: 5, score5: 5,
        reasoning1: "Excellent", reasoning2: "Excellent", reasoning3: "Excellent", reasoning4: "Excellent", reasoning5: "Excellent"
    });

    const result = evaluateQualityGateResponse(aiResponse);

    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.overallScore, 5);
    assert.strictEqual(result.score1, 5);
    assert.strictEqual(result.reasoning1, "Excellent");
});

test('evaluateQualityGateResponse - Minimum Pass Threshold', () => {
    // 4 questions with score 3, 1 question with score 2 -> Should PASS
    const aiResponse = JSON.stringify({
        score1: 3, score2: 3, score3: 3, score4: 3, score5: 2,
        reasoning1: "R1", reasoning2: "R2", reasoning3: "R3", reasoning4: "R4", reasoning5: "R5"
    });

    const result = evaluateQualityGateResponse(aiResponse);

    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.overallScore, (3 + 3 + 3 + 3 + 2) / 5); // 2.8
});

test('evaluateQualityGateResponse - Failure (Not enough passing scores)', () => {
    // 3 questions with score 3, 2 questions with score 2 -> Should FAIL
    const aiResponse = JSON.stringify({
        score1: 3, score2: 3, score3: 3, score4: 2, score5: 2,
        reasoning1: "R1", reasoning2: "R2", reasoning3: "R3", reasoning4: "R4", reasoning5: "R5"
    });

    const result = evaluateQualityGateResponse(aiResponse);

    assert.strictEqual(result.passed, false);
});

test('evaluateQualityGateResponse - Score Clamping (Out of bounds)', () => {
    const aiResponse = JSON.stringify({
        score1: 10,  // Should clamp to 5
        score2: 0,   // Should clamp to 1
        score3: -5,  // Should clamp to 1
        score4: 6,   // Should clamp to 5
        score5: 3,
        reasoning1: "R1", reasoning2: "R2", reasoning3: "R3", reasoning4: "R4", reasoning5: "R5"
    });

    const result = evaluateQualityGateResponse(aiResponse);

    assert.strictEqual(result.score1, 5);
    assert.strictEqual(result.score2, 1);
    assert.strictEqual(result.score3, 1);
    assert.strictEqual(result.score4, 5);
    assert.strictEqual(result.score5, 3);
});

test('evaluateQualityGateResponse - Handle String Scores', () => {
    const aiResponse = JSON.stringify({
        score1: "4",
        score2: "2.7", // Should round to 3
        score3: "5",
        score4: "5",
        score5: "5",
        reasoning1: "R1", reasoning2: "R2", reasoning3: "R3", reasoning4: "R4", reasoning5: "R5"
    });

    const result = evaluateQualityGateResponse(aiResponse);

    assert.strictEqual(result.score1, 4);
    assert.strictEqual(result.score2, 3);
    assert.strictEqual(result.passed, true);
});

test('evaluateQualityGateResponse - Handle Missing or Invalid Fields', () => {
    const aiResponse = JSON.stringify({
        score1: 5,
        // score2 missing
        score3: null,
        score4: undefined,
        score5: "not a number",
        reasoning1: "R1"
        // reasonings missing
    });

    const result = evaluateQualityGateResponse(aiResponse);

    // Missing/Invalid scores should default to 1 via (Number(n) || 1) then clamp
    assert.strictEqual(result.score1, 5);
    assert.strictEqual(result.score2, 1);
    assert.strictEqual(result.score3, 1);
    assert.strictEqual(result.score4, 1);
    assert.strictEqual(result.score5, 1);
    assert.strictEqual(result.reasoning1, "R1");
    assert.strictEqual(result.reasoning2, ""); // Defaulted to ""
    assert.strictEqual(result.passed, false);
});

test('evaluateQualityGateResponse - Invalid JSON Throws', () => {
    const aiResponse = "This is not JSON";

    assert.throws(() => {
        evaluateQualityGateResponse(aiResponse);
    }, /Quality gate returned non-parseable JSON/);
});
