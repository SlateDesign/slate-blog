/*
 * @Author: kim
 * @Description: 处于测试中
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import List, { type ListItem } from '../list';
import Tags, { type TagItem } from '../tags';
import Button from '../../button';

const Contents = () => {
  const currentPage = useRef(1);
  const [posts, setPosts] = useState<ListItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [activeTagName, setActiveTagName] = useState('All');
  const [hasMore, setHasMore] = useState(false);

  const fetchPostList = useCallback(
    async (payload?: { page?: number; tag?: string }) => {
      const mergedPayload: Record<string, string> = {};
      if (payload?.page) {
        mergedPayload.page = payload.page.toString();
      }
      if (payload?.tag && payload.tag !== 'All') {
        mergedPayload.tag = payload.tag;
      }
      const params = new URLSearchParams(mergedPayload);

      const res = await (await fetch(`/api/posts${params.size > 0 ? `?${params.toString()}` : ''}`)).json();
      setPosts((p) =>
        mergedPayload.page === '1' ? res.data : [...p, ...res.data],
      );
      setHasMore(res.hasMore);
    },
    [activeTagName],
  );

  const fetchTags = useCallback(async () => {
    const res = await (await fetch('/api/tags')).json();
    setTags(res.data);
  }, []);

  useEffect(() => {
    fetchPostList();
    fetchTags();
  }, []);

  const handleMore = useCallback(() => {
    currentPage.current++;
    fetchPostList({
      page: currentPage.current,
      tag: activeTagName,
    });
  }, [fetchPostList, activeTagName]);

  const handleTagChange = useCallback(
    (tag: string) => {
      setActiveTagName(tag);
      currentPage.current = 1;
      fetchPostList({
        page: currentPage.current,
        tag,
      });
    },
    [fetchPostList],
  );

  return (
    <>
      <section className="mb-16">
        <Tags
          activeName={activeTagName}
          items={tags}
          onChange={handleTagChange}
        />
      </section>

      <section className="mb-16">
        <List dataSource={posts} />
        {hasMore && (
          <Button className="m-auto mt-6" block onClick={handleMore}>
            More
          </Button>
        )}
      </section>
    </>
  );
};

export default Contents;
