import "server-only";

// ==========================================
// Types
// ==========================================

export interface GitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface GitHubSponsor {
  id: string;
  login: string;
  name?: string;
  avatarUrl: string;
  url: string;
  tier?: {
    name: string;
    monthlyPriceInDollars: number;
  };
}

interface FetchOptions extends RequestInit {
  revalidate?: number;
}

// ==========================================
// Configuration & Core Fetcher
// ==========================================

const DEFAULT_OWNER = process.env.GITHUB_OWNER || "Fuma-nama";
const DEFAULT_REPO = process.env.GITHUB_REPO || "fumadocs";
const TOKEN = process.env.GITHUB_TOKEN;

async function fetchGitHubRest<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T | null> {
  const { revalidate = 86400, ...fetchOptions } = options;

  try {
    const res = await fetch(`https://api.github.com${endpoint}`, {
      ...fetchOptions,
      next: { revalidate, ...(fetchOptions.next || {}) },
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...(TOKEN && { Authorization: `Bearer ${TOKEN}` }),
        ...fetchOptions.headers,
      },
    });

    if (!res.ok) {
      console.error(
        `GitHub API error [${res.status}]: ${res.statusText} for ${endpoint}`,
      );
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch from GitHub API (${endpoint}):`, error);
    return null;
  }
}

async function fetchGitHubGraphQL<T>(
  query: string,
  variables: Record<string, any> = {},
  revalidate = 86400,
): Promise<T | null> {
  if (!TOKEN) {
    console.warn(
      "GITHUB_TOKEN is required for GitHub GraphQL API requests (e.g. Sponsors).",
    );
    return null;
  }

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
    });

    if (!res.ok) {
      console.error(
        `GitHub GraphQL API error [${res.status}]: ${res.statusText}`,
      );
      return null;
    }

    const json = await res.json();

    if (json.errors) {
      console.error("GitHub GraphQL errors:", json.errors);
      return null;
    }

    return json.data;
  } catch (error) {
    console.error("Failed to execute GitHub GraphQL query:", error);
    return null;
  }
}

// ==========================================
// Exported API Functions
// ==========================================

/**
 * Fetch top contributors for a repository.
 */
export async function getTopContributors(
  limit = 100,
  owner = DEFAULT_OWNER,
  repo = DEFAULT_REPO,
): Promise<GitHubContributor[]> {
  const data = await fetchGitHubRest<GitHubContributor[]>(
    `/repos/${owner}/${repo}/contributors?per_page=${limit}`,
    { revalidate: 86400 },
  );

  return Array.isArray(data) ? data : [];
}

/**
 * Fetch sponsors for the repository owner or account using GitHub GraphQL API.
 */
export async function getSponsors(
  login = DEFAULT_OWNER,
  limit = 50,
): Promise<GitHubSponsor[]> {
  const query = `
    query($login: String!, $first: Int!) {
      user(login: $login) {
        sponsorshipsAsMaintainer(first: $first) {
          nodes {
            sponsorEntity {
              __typename
              ... on User {
                id
                login
                name
                avatarUrl
                url
              }
              ... on Organization {
                id
                login
                name
                avatarUrl
                url
              }
            }
            tier {
              name
              monthlyPriceInDollars
            }
          }
        }
      }
    }
  `;

  const data = await fetchGitHubGraphQL<any>(
    query,
    { login, first: limit },
    86400,
  );

  const nodes = data?.user?.sponsorshipsAsMaintainer?.nodes;
  if (!nodes || !Array.isArray(nodes)) return [];

  const sponsors = nodes
    .filter((node) => node?.sponsorEntity)
    .map((node) => ({
      id: node.sponsorEntity.id,
      login: node.sponsorEntity.login,
      name: node.sponsorEntity.name,
      avatarUrl: node.sponsorEntity.avatarUrl,
      url: node.sponsorEntity.url,
      tier: node.tier
        ? {
            name: node.tier.name,
            monthlyPriceInDollars: node.tier.monthlyPriceInDollars,
          }
        : undefined,
    }));

  return sponsors.sort((a, b) => {
    const priceA = a.tier?.monthlyPriceInDollars || 0;
    const priceB = b.tier?.monthlyPriceInDollars || 0;
    return priceB - priceA;
  });
}
