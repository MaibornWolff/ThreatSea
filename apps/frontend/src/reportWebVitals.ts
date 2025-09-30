import type { Metric } from "web-vitals";

export function reportWebVitals(metricReporter: ((metric: Metric) => void) | undefined = undefined) {
    if (metricReporter !== undefined) {
        import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
            onCLS(metricReporter, { reportAllChanges: true });
            onINP(metricReporter, { reportAllChanges: true });
            onFCP(metricReporter, { reportAllChanges: true });
            onLCP(metricReporter, { reportAllChanges: true });
            onTTFB(metricReporter, { reportAllChanges: true });
        });
    }
}
