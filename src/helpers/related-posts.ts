export interface RelatedPostCandidate {
  slug: string;
  data: {
    title: string;
    description?: string;
    tags?: string[];
    draft?: boolean;
    pubDate?: Date;
  };
}

const YEAR_IN_MILLISECONDS = 365 * 24 * 60 * 60 * 1000;

export function calculateRelatedPostScore(
  currentPost: RelatedPostCandidate,
  candidate: RelatedPostCandidate,
): number {
  const currentTags = new Set(currentPost.data.tags ?? []);
  const candidateTags = new Set(candidate.data.tags ?? []);
  const largestTagCount = Math.max(currentTags.size, candidateTags.size);
  const commonTagCount = [...currentTags].filter((tag) =>
    candidateTags.has(tag),
  ).length;
  const tagScore = largestTagCount === 0 ? 0 : commonTagCount / largestTagCount;

  const currentTime = currentPost.data.pubDate?.getTime();
  const candidateTime = candidate.data.pubDate?.getTime();
  const dateScore =
    currentTime === undefined || candidateTime === undefined
      ? 0
      : Math.max(
          0,
          1 - Math.abs(currentTime - candidateTime) / YEAR_IN_MILLISECONDS,
        );

  return tagScore * 0.7 + dateScore * 0.3;
}

export function getRelatedPosts<T extends RelatedPostCandidate>(
  currentPost: T,
  candidates: T[],
  limit = 3,
): T[] {
  return candidates
    .filter(
      (candidate) =>
        candidate.slug !== currentPost.slug &&
        candidate.data.draft !== true &&
        candidate.data.pubDate !== undefined,
    )
    .map((post) => ({
      post,
      score: calculateRelatedPostScore(currentPost, post),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.post.data.pubDate!.getTime() -
          left.post.data.pubDate!.getTime() ||
        (left.post.slug < right.post.slug
          ? -1
          : left.post.slug > right.post.slug
            ? 1
            : 0),
    )
    .slice(0, Math.max(0, limit))
    .map(({ post }) => post);
}
