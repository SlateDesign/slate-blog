export const prerender = false;
import { type APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const PAGE_SIZE = 10; // 每页显示的帖子数量

export const GET: APIRoute = async ({ url }) => {
  let postCollection = (
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
  const postList = postCollection.slice((page - 1) * pageSize, page * pageSize);

  return new Response(
    JSON.stringify({
      data: postList,
      total,
      page,
      pageSize,
      hasMore: pageSize <= postList.length,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
};

