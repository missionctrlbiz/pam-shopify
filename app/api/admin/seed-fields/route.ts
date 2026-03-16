/**
 * POST /api/admin/seed-fields
 *
 * Idempotent upsert of all 18 ClinicalField records.
 * Safe to call on any environment — uses upsert so it never creates duplicates.
 * Protected: admin only.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { FieldCategory } from "@/lib/enums"

const CLINICAL_FIELDS: Array<{
    fieldKey: string
    fieldCategory: FieldCategory
    displayName: string
    description: string
    clinicalContext: string
    exampleValues: string[]
}> = [
        // ── CHIEF_COMPLAINT ───────────────────────────────────────────────────────
        {
            fieldKey: "presenting_chief_complaint",
            fieldCategory: "CHIEF_COMPLAINT",
            displayName: "Presenting Chief Complaint",
            description: "How to accurately document and interpret a patient's chief complaint in psychiatric practice",
            clinicalContext: "PMHNP students often struggle to distinguish between a patient's verbatim complaint and the clinical interpretation required for DSM documentation.",
            exampleValues: ["'I can't sleep and I keep hearing things'", "'My mood is all over the place'", "'I feel like everyone is against me'"],
        },
        {
            fieldKey: "symptom_onset_duration",
            fieldCategory: "CHIEF_COMPLAINT",
            displayName: "Symptom Onset & Duration",
            description: "Clinically documenting when symptoms started, how long they have persisted, and episodic vs chronic patterns",
            clinicalContext: "Onset and duration directly inform DSM criterion A thresholds and differential diagnosis. A common board exam trap.",
            exampleValues: ["acute onset within 1 week", "insidious onset over 6 months", "episodic with full remission between episodes"],
        },
        {
            fieldKey: "precipitating_factors",
            fieldCategory: "CHIEF_COMPLAINT",
            displayName: "Precipitating & Perpetuating Factors",
            description: "Identifying stressors, triggers, and maintaining factors that caused or sustain the psychiatric presentation",
            clinicalContext: "Biopsychosocial formulation requires clear articulation of precipitants vs baseline function — often tested on board exams.",
            exampleValues: ["recent job loss", "medication non-adherence", "substance use relapse"],
        },
        // ── MSE ───────────────────────────────────────────────────────────────────
        {
            fieldKey: "mse_thought_process",
            fieldCategory: "MSE",
            displayName: "Mental Status Exam: Thought Process",
            description: "Documenting and interpreting thought process abnormalities: circumstantiality, tangentiality, flight of ideas, loosening of associations",
            clinicalContext: "Thought process is one of the most frequently mischaracterized MSE elements. Students confuse 'content' with 'process' on exams.",
            exampleValues: ["circumstantial", "tangential", "flight of ideas", "thought blocking", "loosening of associations"],
        },
        {
            fieldKey: "mse_affect_mood",
            fieldCategory: "MSE",
            displayName: "Mental Status Exam: Affect & Mood",
            description: "Distinguishing subjective mood from observed affect; documenting range, intensity, lability, and congruence",
            clinicalContext: "Affect vs mood distinction is a board-exam staple. Mood = patient's subjective experience; Affect = clinician's observation.",
            exampleValues: ["mood: 'I feel depressed' / affect: blunted, restricted range", "mood: 'fine' / affect: labile, incongruent"],
        },
        {
            fieldKey: "mse_insight_judgment",
            fieldCategory: "MSE",
            displayName: "Mental Status Exam: Insight & Judgment",
            description: "Assessing patient's awareness of their illness and their ability to make safe, reality-based decisions",
            clinicalContext: "Poor insight is a core predictor of medication non-adherence and hospitalization risk. Critical for crisis assessment.",
            exampleValues: ["intact insight", "partial insight", "absent insight", "impaired judgment"],
        },
        // ── DIAGNOSTIC ────────────────────────────────────────────────────────────
        {
            fieldKey: "bipolar_vs_mdd_differential",
            fieldCategory: "DIAGNOSTIC",
            displayName: "Bipolar vs MDD Differential",
            description: "Distinguishing bipolar I, II, and cyclothymia from recurrent MDD using DSM-5 criteria",
            clinicalContext: "Misdiagnosis of bipolar disorder as MDD leads to antidepressant monotherapy — can trigger mania. A critical clinical safety issue.",
            exampleValues: ["hypomanic episodes lasting ≥4 days", "grandiosity + decreased need for sleep", "mood congruent vs incongruent psychosis"],
        },
        {
            fieldKey: "psychosis_differential",
            fieldCategory: "DIAGNOSTIC",
            displayName: "Psychotic Disorders Differential",
            description: "Differentiating schizophrenia, schizoaffective disorder, brief psychotic disorder, and substance-induced psychosis",
            clinicalContext: "Duration criteria and mood episode overlap are the key differentiators tested on ANCC/AANP board exams.",
            exampleValues: ["schizophrenia ≥6 months", "brief psychotic disorder <1 month", "schizoaffective requires concurrent mood episode"],
        },
        {
            fieldKey: "anxiety_disorders_differential",
            fieldCategory: "DIAGNOSTIC",
            displayName: "Anxiety Disorders Differential",
            description: "Distinguishing GAD, panic disorder, social anxiety, PTSD, and OCD using DSM-5 specifiers and duration criteria",
            clinicalContext: "Comorbidity is the rule in anxiety — over 60% have co-occurring depression. Correct hierarchy prevents incomplete treatment.",
            exampleValues: ["GAD ≥6 months excessive worry", "panic disorder uncued attacks + anticipatory anxiety", "PTSD requires trauma criterion A"],
        },
        // ── RISK_ASSESSMENT ───────────────────────────────────────────────────────
        {
            fieldKey: "suicide_risk_stratification",
            fieldCategory: "RISK_ASSESSMENT",
            displayName: "Suicide Risk Stratification",
            description: "Applying evidence-based frameworks (Columbia C-SSRS, SAD PERSONS) to quantify and document suicide risk level",
            clinicalContext: "Risk stratification — not just screening — is the standard of care. NPs must document LOW/MODERATE/HIGH with clinical reasoning.",
            exampleValues: ["low risk: ideation without plan, strong protective factors", "high risk: plan + means + intent + recent attempt"],
        },
        {
            fieldKey: "homicide_violence_risk",
            fieldCategory: "RISK_ASSESSMENT",
            displayName: "Homicide & Violence Risk Assessment",
            description: "Assessing and documenting risk of harm to others including Tarasoff duty-to-warn obligations",
            clinicalContext: "Duty to protect is a legal requirement in most states. Providers must document target identification, means access, and intent clearly.",
            exampleValues: ["Tarasoff warning required", "HCR-20 structured assessment", "impulsive vs predatory violence distinction"],
        },
        {
            fieldKey: "self_harm_assessment",
            fieldCategory: "RISK_ASSESSMENT",
            displayName: "Non-Suicidal Self-Injury (NSSI) Assessment",
            description: "Distinguishing NSSI from suicidal self-harm, documenting function, frequency, and safety planning",
            clinicalContext: "NSSI ≠ suicidal behavior though it is a risk amplifier. Students commonly conflate the two — a board exam and clinical safety issue.",
            exampleValues: ["emotion regulation function", "anti-dissociation function", "NSSI without suicidal intent"],
        },
        // ── DOCUMENTATION ─────────────────────────────────────────────────────────
        {
            fieldKey: "soap_note_documentation",
            fieldCategory: "DOCUMENTATION",
            displayName: "SOAP Note Documentation",
            description: "Writing defensible, billable psychiatric SOAP notes that meet CMS and payer requirements",
            clinicalContext: "Nearly 60% of malpractice claims against PMHNPs involve documentation deficiencies. Correct SOAP structure is both clinical and legal protection.",
            exampleValues: ["Subjective: patient's verbatim chief complaint", "Assessment: DSM diagnosis with specifiers", "Plan: medication + therapy + follow-up"],
        },
        {
            fieldKey: "icd10_coding_accuracy",
            fieldCategory: "DOCUMENTATION",
            displayName: "ICD-10 Coding for Psychiatric Diagnoses",
            description: "Selecting correct ICD-10-CM codes for psychiatric diagnoses including specifiers and severity modifiers",
            clinicalContext: "Wrong ICD-10 codes trigger claim denials and audits. MDD has over 12 code variants — students must learn specifier coding.",
            exampleValues: ["F32.1 Major depressive disorder, single episode, moderate", "F31.31 Bipolar I, current episode depressed, mild"],
        },
        {
            fieldKey: "informed_consent_documentation",
            fieldCategory: "DOCUMENTATION",
            displayName: "Informed Consent Documentation",
            description: "Documenting informed consent for psychiatric medications including black-box warnings, alternatives, and capacity assessment",
            clinicalContext: "Underdocumented informed consent is a common malpractice exposure area. Capacity assessment is legally distinct from competency.",
            exampleValues: ["medication risks/benefits/alternatives discussed", "patient demonstrates understanding", "capacity vs competency distinction"],
        },
        // ── INTERVIEW ─────────────────────────────────────────────────────────────
        {
            fieldKey: "psychiatric_interview_structure",
            fieldCategory: "INTERVIEW",
            displayName: "Psychiatric Interview Structure",
            description: "Conducting and organizing the comprehensive psychiatric interview: HPI, psychiatric history, family history, social history",
            clinicalContext: "A structured interview approach prevents critical omissions that lead to missed diagnoses and unsafe treatment plans.",
            exampleValues: ["HPI with 8 dimensions", "complete medication reconciliation", "developmental history for personality assessment"],
        },
        {
            fieldKey: "motivational_interviewing",
            fieldCategory: "INTERVIEW",
            displayName: "Motivational Interviewing Techniques",
            description: "Using MI principles (OARS) to enhance medication adherence and treatment engagement in psychiatric patients",
            clinicalContext: "MI is evidence-based for improving psychiatric medication adherence — critical skill for PMHNPs managing chronic mental illness.",
            exampleValues: ["OARS: Open questions, Affirmations, Reflections, Summaries", "rolling with resistance", "change talk elicitation"],
        },
        {
            fieldKey: "trauma_informed_interviewing",
            fieldCategory: "INTERVIEW",
            displayName: "Trauma-Informed Interview Approach",
            description: "Adapting interview techniques to avoid re-traumatization while gathering complete clinical information",
            clinicalContext: "Over 70% of psychiatric patients have trauma histories. Trauma-uninformed interviewing damages therapeutic alliance and clinical accuracy.",
            exampleValues: ["universal precautions approach", "titrated trauma inquiry", "window of tolerance framework"],
        },
    ]

export async function POST() {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error: upsertError } = await supabaseAdmin
        .from("clinical_fields")
        .upsert(
            CLINICAL_FIELDS.map((field) => ({
                fieldKey: field.fieldKey,
                fieldCategory: field.fieldCategory,
                displayName: field.displayName,
                description: field.description,
                clinicalContext: field.clinicalContext,
                exampleValues: field.exampleValues,
                isActive: true,
            })),
            { onConflict: "fieldKey" }
        )

    if (upsertError) {
        console.error("[seed-fields] Supabase upsert error:", upsertError)
        return NextResponse.json({ error: "Failed to seed clinical fields" }, { status: 500 })
    }

    const { count, error: countError } = await supabaseAdmin
        .from("clinical_fields")
        .select("id", { count: "exact", head: true })

    if (countError) {
        console.error("[seed-fields] Count error:", countError)
    }

    return NextResponse.json({
        upserted: CLINICAL_FIELDS.length,
        total: count ?? CLINICAL_FIELDS.length,
    })
}

export async function GET() {
    const session = await auth()
    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { count, error } = await supabaseAdmin
        .from("clinical_fields")
        .select("id", { count: "exact", head: true })
        .eq("isActive", true)

    if (error) {
        console.error("[seed-fields] Count fetch error:", error)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }

    return NextResponse.json({ count: count ?? 0 })
}
