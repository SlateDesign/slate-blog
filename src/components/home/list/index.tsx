/*
 * @Author: kim
 * @Description: 处于测试中
 */
export interface ListItem {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  url: string;
}

export interface ListProps {
  dataSource: ListItem[];
}

const List = (props: ListProps) => {
  const { dataSource } = props;

  return (
    <div className="text-base text-slate12">
      {dataSource.map((item) => (
        <a
          className="flex cursor-pointer flex-col justify-between rounded-lg py-2.5 transition-all active:scale-[0.995] active:bg-slate4 sm:flex-row sm:items-center sm:px-2 sm:hover:bg-slate3"
          href={item.url}
          title={item.title}
          key={item.id}
        >
          <span className="flex-shrink-0">{item.title}</span>
          <span className="mx-8 hidden h-px w-full flex-grow border-t border-dashed border-slate6 sm:flex" />
          <span className="flex-shrink-0 text-slate8">{item.pubDate}</span>
        </a>
      ))}
    </div>
  );
};

export default List;
