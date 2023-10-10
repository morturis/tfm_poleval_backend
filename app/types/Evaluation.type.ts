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
  role: z.enum(["leader", "member", "other"]),
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
  measurements: z.array(MeasurementSchema),
});

const InterventionSchema = z.strictObject({
  name: z.string(),
  problemToFix: z.string().optional(),
  strategicPlan: z.string().optional(),
  otherInterventions: z.string().optional(),
  blockers: z.string().optional(),
  indicators: z.array(IndicatorSchema),
});
export const EvaluationResponseSchema = z.record(z.string(), z.string());
export const EvaluationSchema = z.strictObject({
  code: z.string(),
  intervention: InterventionSchema,

  org: z.string().optional(),
  lifeCycle: z.string().optional(),
  goal: z.string().optional(),
  reason: z.string().optional(),
  utility: z.string().optional(),
  delimitation: DelimitationSchema.optional(),
  teamMembers: z.array(EvalTeamMemberSchema).optional(),

  form: z.record(z.string(), z.unknown()).optional(),
  responses: z.array(EvaluationResponseSchema).optional(),

  tools: z.array(ToolTechniqueSchema).optional(),
  techniques: z.array(ToolTechniqueSchema).optional(),
  criteria: z.array(CriteriaSchema).optional(),

  indicators: z.array(IndicatorSchema).optional(),
});

export type Evaluation = z.infer<typeof EvaluationSchema>;
