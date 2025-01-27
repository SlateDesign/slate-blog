export const prerender = false;
import { type APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const postCollection = await getCollection('post', ({ data }) => {
    return import.meta.env.DEV || data.draft !== true;
  });

  const tagCounts = postCollection.reduce<Record<string, number>>(
    (res, post) => {
      const postTags = post.data.tags;
      if (!postTags || !postTags.length) return res;
      postTags.forEach((tag) => {
        if (tag.trim() === '') return;

        if (res[tag]) {
          res[tag]++;
        } else {
          res[tag] = 1;
        }
      });
      return res;
    },
    {
      All: postCollection.length,
    },
  );

  const tags = Object.keys(tagCounts).map((tag) => ({
    name: tag,
    count: tagCounts[tag],
  }));

  return new Response(
    JSON.stringify({
      data: tags,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
};
