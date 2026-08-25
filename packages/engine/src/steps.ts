import { prisma } from '@greed-advisor/db';

export type StepStatus = 'ok' | 'warn' | 'skipped' | 'failed';

// Records a step of an automation run. Returns the step id so the caller can
// call `endStep` once the work completes.
export async function beginStep(
  runLogId: number,
  step: string,
  label: string,
  detail?: unknown
): Promise<number> {
  const row = await prisma.automationRunStep.create({
    data: {
      runLogId,
      step,
      label,
      status: 'running',
      detail: detail !== undefined ? (detail as object) : undefined
    }
  });
  return row.id;
}

export async function endStep(stepId: number, status: StepStatus, detail?: unknown): Promise<void> {
  await prisma.automationRunStep.update({
    where: { id: stepId },
    data: {
      status,
      finishedAt: new Date(),
      detail: detail !== undefined ? (detail as object) : undefined
    }
  });
}

// Convenience: record a completed step in one call (begin + end immediately).
export async function recordStep(
  runLogId: number,
  step: string,
  label: string,
  status: StepStatus,
  detail?: unknown
): Promise<void> {
  const id = await beginStep(runLogId, step, label);
  await endStep(id, status, detail);
}
