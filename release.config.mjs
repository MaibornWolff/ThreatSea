import createPreset from "conventional-changelog-conventionalcommits";

const { transform: defaultTransform } = createPreset().writer;

/** @type {import('semantic-release').GlobalConfig} */
export default {
    branches: [
        "main",
        {
            name: "next",
            prerelease: "rc",
        },
    ],
    plugins: [
        [
            "@semantic-release/commit-analyzer",
            {
                preset: "conventionalcommits",
                releaseRules: [
                    { type: "feat", release: "minor" },
                    { type: "fix", release: "patch" },
                    { type: "perf", release: "patch" },
                    { type: "revert", release: "patch" },
                    { type: "style", release: false },
                    { type: "refactor", release: "patch" },
                    { type: "test", release: false },
                    { type: "build", release: false },
                    { type: "chore", release: false },
                    { type: "ci", release: false },
                    { scope: "no-release", release: false },
                ],
                parserOpts: {
                    noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
                },
            },
        ],
        [
            "@semantic-release/release-notes-generator",
            {
                preset: "conventionalcommits",
                parserOpts: {
                    noteKeywords: ["BREAKING CHANGE", "BREAKING CHANGES"],
                },
                writerOpts: {
                    commitsSort: ["subject", "scope"],
                    transform: (commit, context) => {
                        if (commit.scope === "deps") return false;
                        return defaultTransform(commit, context);
                    },
                },
            },
        ],
        [
            "@semantic-release/exec",
            {
                publishCmd:
                    'echo "new_release_published=true" >> $GITHUB_OUTPUT && echo "new_release_version=${nextRelease.version}" >> $GITHUB_OUTPUT',
            },
        ],
        [
            "@semantic-release/github",
            {
                successComment: false,
                releasedLabels: false,
            },
        ],
    ],
};
