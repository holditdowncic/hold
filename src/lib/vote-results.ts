import { categories, categoryLabels } from "@/data/categories";

export interface VoteResultRow {
  category_key: string;
  nominee_name: string;
  voter_email?: string | null;
  created_at?: string | null;
}

export interface VoteVerificationRow {
  email: string;
  voted_at?: string | null;
  created_at?: string | null;
}

interface BuildVoteResultsOptions {
  categoryFilter?: string | null;
  nomineeLimit?: number;
}

function normalizeNomineeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function buildVoteResultsSummary(
  votes: VoteResultRow[],
  verifications: VoteVerificationRow[],
  options: BuildVoteResultsOptions = {},
) {
  const nomineeLimit = Math.min(Math.max(options.nomineeLimit ?? 5, 1), 25);
  const categoryFilter = options.categoryFilter?.trim() || null;

  const filteredVotes = categoryFilter
    ? votes.filter((vote) => vote.category_key === categoryFilter)
    : votes;

  const categoryBuckets = new Map<string, Map<string, number>>();
  const uniqueVoterEmails = new Set<string>();
  let latestVoteAt: string | null = null;

  for (const vote of filteredVotes) {
    const categoryKey = vote.category_key;
    const nomineeName = normalizeNomineeName(vote.nominee_name);

    if (!categoryBuckets.has(categoryKey)) {
      categoryBuckets.set(categoryKey, new Map<string, number>());
    }

    const nomineeCounts = categoryBuckets.get(categoryKey)!;
    nomineeCounts.set(nomineeName, (nomineeCounts.get(nomineeName) ?? 0) + 1);

    if (vote.voter_email) {
      uniqueVoterEmails.add(vote.voter_email.toLowerCase());
    }

    if (vote.created_at && (!latestVoteAt || vote.created_at > latestVoteAt)) {
      latestVoteAt = vote.created_at;
    }
  }

  const verificationEmails = new Set(
    verifications
      .map((verification) => verification.email?.toLowerCase().trim())
      .filter((email): email is string => Boolean(email)),
  );

  const categoryResults = categories
    .filter((category) => !categoryFilter || category.key === categoryFilter)
    .map((category) => {
      const nomineeCounts = categoryBuckets.get(category.key) ?? new Map<string, number>();
      const nominees = [...nomineeCounts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((left, right) => {
          if (right.count !== left.count) {
            return right.count - left.count;
          }

          return left.name.localeCompare(right.name);
        });

      return {
        categoryKey: category.key,
        categoryTitle: category.title,
        totalVotes: nominees.reduce((sum, nominee) => sum + nominee.count, 0),
        nomineeCount: nominees.length,
        leaders: nominees.slice(0, nomineeLimit),
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      categoriesTracked: categoryResults.length,
      ballotsSubmitted: verificationEmails.size,
      voteRecords: filteredVotes.length,
      uniqueVotersInVotes: uniqueVoterEmails.size,
      latestVoteAt,
      registeredVoters: null,
      registeredVotersMeaning:
        "No separate voter registration table exists. ballotsSubmitted counts verified emails that have already voted.",
    },
    categories: categoryResults,
    categoryLabels,
  };
}
