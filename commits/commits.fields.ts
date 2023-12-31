// Taken from:
// https://github.com/conventional-changelog/commitlint/blob/master/@commitlint/types/src/prompt.ts
type CommitTypes = {
  [type: string]: {
    title: string
    description: string
    emoji?: string
  }
}

// Custom commit types
export const CommitFields: CommitTypes = {
  feat: {
    title: 'Features',
    description: 'New behaviors or major milestones.'
  },
  refactor: {
    title: 'Refactors',
    description: 'Changes to codebase to improve structure, organization, or readability.'
  },
  fix: {
    title: 'Fixes',
    description: 'Bug fixes.'
  },
  style: {
    title: 'Styles',
    description: 'Restyling of components, images, or other design assets.'
  },
  chore: {
    title: 'Chores',
    description: "Changes that don't modify src."
  },
  working: {
    title: 'Working',
    description: 'Intermediate commits that represent a working idea, or one that is in progress'
  },
  perf: {
    title: 'Peformance Enhancements',
    description: 'Optimizations and improvements (e.g.page load time, images, seo, etc.).'
  },
  docs: {
    title: 'Docs',
    description: 'Changes to README or other documentation.'
  },
  test: {
    title: 'Tests',
    description: 'Additions/modifications to test cases.'
  }
} as const
