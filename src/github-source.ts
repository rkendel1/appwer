export type Availability = "available" | "unavailable";

export type GitHubRepositorySource = {
  provider: "github";
  owner: string;
  repository: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  branch?: string;
  commitSha?: string;
  commitUrl?: string;
  metadataAvailability: {
    branch: Availability;
    commit: Availability;
    projects: Availability;
  };
};

export function discoverGitHubRepository(input: Omit<GitHubRepositorySource, "provider" | "metadataAvailability">): GitHubRepositorySource {
  return {
    provider: "github",
    ...input,
    metadataAvailability: {
      branch: input.branch ? "available" : "unavailable",
      commit: input.commitSha ? "available" : "unavailable",
      projects: "unavailable"
    }
  };
}
