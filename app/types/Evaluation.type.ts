import * as z from "zod";

const DelimitationSchema = z
  .object({
    other: z.string(),
    timePeriod: z.strictObject({
      startDate: z.string(), //ISO string date
      endDate: z.string(), //ISO string date
    }),
    geo: z.string(),
    actors: z.array(z.string()),
  })
  .partial();

const EvalTeamMemberSchema = z.strictObject({
  name: z.string(),
  role: z.string(),
  type: z.enum(["leader", "member", "other"]),
});

const ToolTechniqueSchema = z.strictObject({
  name: z.string(),
  description: z.string(),
  useCase: z.string(),
});

const CriteriaSchema = z.strictObject({
  text: z.string(),
});

const MeasurementSchema = z.strictObject({
  date: z.string(), //ISO string date
  value: z.string().or(z.number()),
});

const IndicatorSchema = z.strictObject({
  name: z.string(),
  measurements: z.array(MeasurementSchema).optional(),
  targetValue: z.string().optional(),
});

const InterventionSchema = z.strictObject({
  name: z.string().optional(),
  problemToFix: z.string().optional(),
  strategicPlan: z.string().optional(),
  otherInterventions: z.string().optional(),
  blockers: z.string().optional(),
  indicators: z.array(IndicatorSchema),
});
const ConclusionRecomendationSchema = z.strictObject({
  text: z.string(),
  reason: z.string(),
});
export const EvaluationResponseSchema = z.record(z.string(), z.string());

enum EvaluationStates {
  FIRST_STEPS = "FIRST_STEPS",
  DESIGNING_FORM = "DESIGNING_FORM",
  ACCEPTING_RESPONSES = "ACCEPTING_RESPONSES",
  CONCLUSIONS = "CONCLUSIONS",
}

export const EvaluationBasicSchema = z.strictObject({
  code: z.string(),
  state: z.nativeEnum(EvaluationStates).optional(),
  intervention: InterventionSchema,

  org: z.string().optional(),
  lifeCycle: z.string().optional(),
  goal: z.string().optional(),
  reason: z.string().optional(),
  utility: z.string().optional(),
  delimitation: DelimitationSchema.optional(),
  teamMembers: z.array(EvalTeamMemberSchema).optional(),

  form: z.array(z.unknown()).optional(),
  responses: z.array(EvaluationResponseSchema).optional(),

  tools: z.array(ToolTechniqueSchema).optional(),
  techniques: z.array(ToolTechniqueSchema).optional(),
  criteria: z.array(CriteriaSchema).optional(),

  indicators: z.array(IndicatorSchema).optional(),

  conclusions: z.array(ConclusionRecomendationSchema).optional(),
  recomendations: z.array(ConclusionRecomendationSchema).optional(),
});

export const EvaluationSchema = EvaluationBasicSchema.transform(
  (evaluation) => {
    const evaluationHasResponses = !!evaluation.responses?.length;
    const evaluationHasForm = !!evaluation.form?.length;
    const evaluationFormIsPublished = evaluationHasForm && true; //TODO

    if (evaluationHasResponses && evaluationFormIsPublished)
      return { ...evaluation, state: "ACCEPTING_RESPONSES" };

    if (evaluationHasResponses && !evaluationFormIsPublished)
      return { ...evaluation, state: "CONCLUSIONS" };

    if (evaluationHasForm) return { ...evaluation, state: "DESIGNING_FORM" };

    return { ...evaluation, state: "FIRST_STEPS" };
  }
).refine(
  (evaluation) => {
    const evaluationHasResponses = !!evaluation.responses?.length;
    const evaluationHasForm = !!evaluation.form?.length;
    const evaluationFormIsPublished = evaluationHasForm && true; //TODO

    if (evaluationHasResponses && evaluationFormIsPublished)
      return evaluation.state === EvaluationStates.ACCEPTING_RESPONSES;

    if (evaluationHasResponses && !evaluationFormIsPublished)
      return evaluation.state === EvaluationStates.CONCLUSIONS;

    if (evaluationHasForm)
      return evaluation.state === EvaluationStates.DESIGNING_FORM;

    return evaluation.state === EvaluationStates.FIRST_STEPS;
  },
  { message: "invalid_state" }
);
export type Evaluation = z.infer<typeof EvaluationSchema>;
