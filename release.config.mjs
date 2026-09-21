// Set by the release workflow's workflow_dispatch input so pre-releases off `next` can be
// labelled alpha/beta/rc; the `main` release path never reads it.
const prereleaseSuffix = process.env.PRERELEASE_SUFFIX || "rc";

export default {
    branches: [
        "main",
        {
            name: "next",
            prerelease: prereleaseSuffix,
        },
    ],
    plugins: [
        [
            "@semantic-release/commit-analyzer",
            {
                preset: "conventionalcommits",
                releaseRules: [
                    {
                        type: "feat",
                        release: "minor",
                    },
                    {
                        type: "fix",
                        release: "patch",
                    },
                    {
                        type: "perf",
                        release: "patch",
                    },
                    {
                        type: "revert",
                        release: "patch",
                    },
                    {
                        type: "style",
                        release: false,
                    },
                    {
                        type: "refactor",
                        release: "patch",
                    },
                    {
                        type: "test",
                        release: false,
                    },
                    {
                        type: "build",
                        release: false,
                    },
                    {
                        type: "chore",
                        release: false,
                    },
                    {
                        type: "ci",
                        release: false,
                    },
                    {
                        scope: "no-release",
                        release: false,
                    },
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
                presetConfig: {
                    types: [
                        {
                            type: "feat",
                            scope: "deps",
                            hidden: true,
                        },
                        {
                            type: "feat",
                            section: "Features",
                        },
                        {
                            type: "feature",
                            scope: "deps",
                            hidden: true,
                        },
                        {
                            type: "feature",
                            section: "Features",
                        },
                        {
                            type: "fix",
                            scope: "deps",
                            hidden: true,
                        },
                        {
                            type: "fix",
                            section: "Bug Fixes",
                        },
                        {
                            type: "perf",
                            scope: "deps",
                            hidden: true,
                        },
                        {
                            type: "perf",
                            section: "Performance Improvements",
                        },
                        {
                            type: "revert",
                            scope: "deps",
                            hidden: true,
                        },
                        {
                            type: "revert",
                            section: "Reverts",
                        },
                    ],
                },
                writerOpts: {
                    commitsSort: ["subject", "scope"],
                },
            },
        ],
        [
            "@semantic-release/exec",
            {
                verifyReleaseCmd:
                    'echo "publish_new_release=true" >> $GITHUB_OUTPUT && echo "new_release_version=${nextRelease.version}" >> $GITHUB_OUTPUT',
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
