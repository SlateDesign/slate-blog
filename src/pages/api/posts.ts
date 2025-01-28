export const prerender = false;
import { type APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const PAGE_SIZE = 2; // 每页显示的帖子数量

async function getAllPosts() {
  const postCollection = (
    await getCollection('post', ({ data }) => {
      return import.meta.env.DEV || data.draft !== true;
    })
  )
    .sort((a, b) => b.data.pubDate!.getTime() - a.data.pubDate!.getTime())
    .map((item) => {
      return {
        ...item.data,
        id: item.id,
        pubDate: item.data.pubDate?.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        url: `/blog/${item.slug}`,
        tags: item.data.tags,
      };
    });

  return postCollection;
}

export const GET: APIRoute = async ({ url }) => {
  let postCollection = await getAllPosts();
  const params = url.searchParams;
  const tag = params.get('tag');

  if (tag) {
    postCollection = postCollection.filter((item) => {
      return item.tags?.includes(tag);
    });
  }

  const page = Number(params.get('page')) || 1;
  const pageSize = Number(params.get('pageSize')) || PAGE_SIZE;
  const total = postCollection.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = page * pageSize;
  const postList = postCollection.slice(startIndex, endIndex);

  return new Response(
    JSON.stringify({
      data: postList,
      total,
      page,
      pageSize,
      hasMore: total > endIndex,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600, stale-while-revalidate=30',
      },
    },
  );
};
