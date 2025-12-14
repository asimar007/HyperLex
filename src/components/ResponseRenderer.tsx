import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SearchResult } from "@/types";

interface ResponseRendererProps {
  response: string;
  searchResults: SearchResult[];
}

export default function ResponseRenderer({
  response,
  searchResults,
}: ResponseRendererProps) {
  if (!response) return null;

  return (
    <div className="max-w-3xl mx-auto rounded-2xl shadow-sm p-6">
      <div className="prose prose-blue max-w-none space-y-4 text-gray-800">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            table: ({ node, ...props }) => (
              <div className="my-8 overflow-x-auto rounded-lg border border-gray-200">
                <table
                  className="w-full text-left border-collapse"
                  {...props}
                />
              </div>
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b border-gray-200 pb-2"
                {...props}
              />
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-gray-50" {...props} />
            ),
            tbody: ({ node, ...props }) => (
              <tbody className="bg-white divide-y divide-gray-200" {...props} />
            ),
            tr: ({ node, ...props }) => (
              <tr className="hover:bg-gray-50 transition-colors" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th
                className="py-3 px-4 font-medium text-sm text-gray-900 border-b border-gray-200"
                {...props}
              />
            ),
            td: ({ node, ...props }) => {
              // Check if the content includes a markdown link
              const content = props.children?.toString() || "";
              if (content.match(/\[.*?\]\(.*?\)/)) {
                return (
                  <td className="py-3 px-4 text-sm text-gray-500">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...linkProps }) => (
                          <a
                            {...linkProps}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </td>
                );
              }
              return (
                <td className="py-3 px-4 text-sm text-gray-500" {...props} />
              );
            },
            pre: ({ node, children, ...props }) => {
              const content = String(children);
              if (content.includes("|") && content.includes("\n")) {
                const rows = content.trim().split("\n");
                const headers = rows[0]
                  .split("|")
                  .filter(Boolean)
                  .map((h) => h.trim());
                const data = rows.slice(2).map((row) =>
                  row
                    .split("|")
                    .filter(Boolean)
                    .map((cell) => cell.trim())
                );

                return (
                  <div className="my-8 overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {headers.map((header, i) => (
                            <th
                              key={i}
                              className="py-3 px-4 font-medium text-sm text-gray-900 border-b border-gray-200"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {data.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className="py-3 px-4 text-sm text-gray-500"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              return <pre {...props}>{children}</pre>;
            },
            a: ({ node, ...props }) => {
              const href = props.href || "";
              const sourceMatch = href.match(/\[Source (\d+)\]/);
              if (sourceMatch) {
                const sourceIndex = parseInt(sourceMatch[1]) - 1;
                const source = searchResults[sourceIndex];
                return (
                  <span className="inline-flex items-center group relative">
                    <a
                      {...props}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      {props.children}
                    </a>
                    {source && (
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-80">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {source.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {source.content}
                          </p>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Visit source →
                          </a>
                        </div>
                      </div>
                    )}
                  </span>
                );
              }
              return (
                <a {...props} className="text-blue-600 hover:text-blue-800" />
              );
            },
          }}
        >
          {response}
        </ReactMarkdown>
      </div>
    </div>
  );
}
