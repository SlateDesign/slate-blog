/*
 * @Author: kim
 * @Description: 处于测试中
 */
import { useCallback } from 'react';

export interface TagItem {
  name: string;
  count?: number;
}

export interface TagsProps {
  activeName?: string;
  items: TagItem[];
  onChange?: (tag: string) => void;
}

const Tags = (props: TagsProps) => {
  const { items, activeName, onChange } = props;

  const handleChange = useCallback(
    (item: TagItem) => {
      console.log(item, activeName);
      if (activeName === item.name) return;
      if (onChange) {
        onChange(item.name);
      }
    },
    [activeName, onChange],
  );

  return (
    <ul className="flex flex-wrap gap-2 text-base text-slate10">
      {items.map((item) => (
        <li
          key={item.name}
          className="block cursor-pointer rounded-full bg-slate3 px-4 py-2 text-slate10 transition-all hover:bg-slate4 hover:text-slate11"
          onClick={() => handleChange(item)}
        >
          {item.name}
          <sup className="text-[10px] text-slate8">{item.count}</sup>
        </li>
      ))}
    </ul>
  );
};

export default Tags;
