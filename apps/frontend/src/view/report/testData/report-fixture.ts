import type { ProjectReport } from "#api/types/project.types.ts";
import type { Milestone } from "#utils/report-risk.ts";
import fixtureData from "./project-report.fixture.json";

export type ReportFixture = ProjectReport & { milestones: Milestone[] | null };

/** A fresh deep copy of the sample project report, safe to modify per test. */
export const buildReportFixture = (): ReportFixture => structuredClone(fixtureData) as unknown as ReportFixture;
