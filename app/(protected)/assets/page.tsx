'use client';

import { useState } from 'react';
import useSWR from 'swr';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AssetItem {
  id: string;
  name: string;
  description: string;
  owner: string | null;
  collaborators: string[];
  source_url: string | null;
  production_url: string | null;
  links: string[] | null;
}

function isHtmlContent(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function formatUrlLabel(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function formatUrlDisplay(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname !== '/' ? parsed.pathname : '';
    return `${hostname}${path}`;
  } catch {
    return url;
  }
}

function getUrlType(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname;

    if (host.includes('github.com')) return 'github';
    if (host.includes('vercel.app') || host.includes('vercel.com')) return 'vercel';
    if (host.includes('docs.google.com')) {
      if (path.includes('/spreadsheets')) return 'sheets';
      if (path.includes('/document')) return 'docs';
      if (path.includes('/presentation')) return 'slides';
      return 'google';
    }
    if (host.includes('drive.google.com')) return 'drive';
    if (host.includes('google.com')) return 'google';
    return 'link';
  } catch {
    return 'link';
  }
}

function UrlIcon({ type }: { type: string }) {
  switch (type) {
    case 'github':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.58 2 12.25c0 4.52 2.865 8.35 6.839 9.7.5.095.682-.22.682-.49 0-.244-.01-1.053-.014-1.91-2.782.622-3.369-1.207-3.369-1.207-.455-1.188-1.11-1.505-1.11-1.505-.907-.638.069-.625.069-.625 1.003.073 1.53 1.06 1.53 1.06.892 1.569 2.341 1.116 2.91.853.09-.67.35-1.116.636-1.373-2.221-.262-4.555-1.142-4.555-5.08 0-1.122.39-2.037 1.03-2.754-.104-.262-.446-1.318.098-2.746 0 0 .84-.275 2.75 1.053A9.248 9.248 0 0 1 12 6.844c.85.004 1.706.12 2.505.352 1.91-1.328 2.748-1.053 2.748-1.053.545 1.428.203 2.484.1 2.746.64.717 1.028 1.632 1.028 2.754 0 3.949-2.338 4.815-4.566 5.072.359.318.678.944.678 1.904 0 1.375-.012 2.485-.012 2.823 0 .273.18.59.688.49C19.135 20.595 22 16.77 22 12.25 22 6.58 17.523 2 12 2Z" />
        </svg>
      );
    case 'vercel':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <path d="M12 4 22 20H2L12 4Z" />
        </svg>
      );
    case 'docs':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V7h3.5L13 3.5Z" />
          <path d="M8 11h8M8 15h8M8 19h6" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case 'sheets':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V7h3.5L13 3.5Z" />
          <path d="M8 11h8M8 14h8M8 17h8M11 10.5v7M14 10.5v7" stroke="currentColor" strokeWidth="1.1" />
        </svg>
      );
    case 'slides':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <rect x="4" y="3" width="16" height="12" rx="2" />
          <path d="M8 7h8M8 10h5M12 15v6" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case 'drive':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <path d="M7.5 3h9L22 12l-5.5 9h-9L2 12 7.5 3Zm1.6 2.7L5.2 12l2.8 4.8h5.6L17 12l-3.9-6.3H9.1Z" />
        </svg>
      );
    case 'google':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <path d="M12 4.5c1.86 0 3.4.62 4.62 1.65l-1.88 1.88C13.46 7.5 12.8 7.3 12 7.3c-2.38 0-4.4 1.6-5.12 3.76l-2.36-1.84C5.68 6.45 8.6 4.5 12 4.5Z" />
          <path d="M4.52 9.22A7.48 7.48 0 0 0 4.5 12c0 .95.17 1.86.47 2.71l2.48-1.92A4.7 4.7 0 0 1 7.3 12c0-.6.1-1.17.28-1.7l-2.06-1.08Z" />
          <path d="M12 19.5c1.65 0 3.04-.54 4.05-1.46l-1.88-1.87c-.52.35-1.18.56-2.17.56-1.95 0-3.6-1.3-4.17-3.05l-2.44 1.88C6.4 17.94 9 19.5 12 19.5Z" />
          <path d="M19.5 12c0-.5-.07-1-.18-1.46H12v2.92h4.2c-.2.98-.78 1.81-1.6 2.36l2.02 1.55c1.18-1.1 1.88-2.72 1.88-4.37Z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 12" />
          <path d="M14 11a5 5 0 0 1 0 7L12.5 20.5a5 5 0 0 1-7-7L7 12" />
        </svg>
      );
  }
}

function UrlLink({ url }: { url: string }) {
  const type = getUrlType(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900"
      title={url}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <UrlIcon type={type} />
      </span>
      <span className="truncate max-w-[220px]">{formatUrlDisplay(url)}</span>
    </a>
  );
}

export default function AssetsPage() {
  const { data: assets = [], error, isLoading } = useSWR<AssetItem[]>('/api/assets');
  const [activeAsset, setActiveAsset] = useState<AssetItem | null>(null);

  return (
    <div className="flex-1 w-full px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-slate-900 tracking-tight">
              Assets
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Track shared links, repositories, and project resources.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
            <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5">
              Read-only
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 md:px-8 py-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Asset Table
              </p>
              {isLoading && (
                <span className="text-xs text-slate-400">Loading assets...</span>
              )}
              {error && (
                <span className="text-xs text-rose-500">Failed to load assets.</span>
              )}
            </div>
          </div>

          {!isLoading && assets.length === 0 && !error && (
            <div className="px-6 md:px-8 py-8 text-sm text-slate-500">
              No assets available yet.
            </div>
          )}

          {assets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm asset-table">
                <thead className="text-[11px] uppercase tracking-[0.2em] text-slate-400 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Name</th>
                    <th className="px-6 py-3.5 font-semibold">Owner</th>
                    <th className="px-6 py-3.5 font-semibold">Collaborators</th>
                    <th className="px-6 py-3.5 font-semibold w-[150px]">Source URLs</th>
                    <th className="px-6 py-3.5 font-semibold w-[130px]">Production</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assets.map((asset) => {
                    const hasLongDescription = asset.description.length > 240;
                    const clampClass = 'richtext-clamp';

                    return (
                      <tr key={asset.id} className="asset-row bg-white align-top">
                        <td className="px-6 py-4 min-w-[320px]">
                          <div className="text-[15px] font-semibold text-slate-900">{asset.name}</div>
                          <div className="mt-1 text-[11px] text-slate-500 caption-preview">
                            {isHtmlContent(asset.description) ? (
                              <div
                                className={`richtext-body ${clampClass}`}
                                dangerouslySetInnerHTML={{
                                  __html: asset.description || '<p><em>No description provided.</em></p>',
                                }}
                              />
                            ) : (
                              <div className="markdown-body markdown-clamp">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    a: ({ ...props }) => (
                                      <a
                                        href={props.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="markdown-link"
                                      >
                                        {props.children}
                                      </a>
                                    ),
                                    pre: ({ children }) => <pre className="markdown-pre">{children}</pre>,
                                    code: ({ children, className }) => {
                                      const isInline = !className;
                                      if (isInline) {
                                        return <code className="markdown-code">{children}</code>;
                                      }
                                      return <code>{children}</code>;
                                    },
                                  }}
                                >
                                  {asset.description || '_No description provided._'}
                                </ReactMarkdown>
                              </div>
                            )}
                            <span className="caption-fade" aria-hidden="true" />
                          </div>
                          {hasLongDescription && (
                            <button
                              type="button"
                              onClick={() => setActiveAsset(asset)}
                              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              View more
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                              {(asset.owner ?? 'U').slice(0, 1).toUpperCase()}
                            </span>
                            <span>{asset.owner ?? 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-[180px] text-xs">
                          {asset.collaborators.length ? asset.collaborators.join(', ') : 'None'}
                        </td>
                        <td className="px-6 py-4 w-[150px]">
                          <div className="flex flex-col gap-2">
                            {asset.links && asset.links.length > 0 ? (
                              asset.links.slice(0, 2).map((link) => (
                                <UrlLink key={link} url={link} />
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">None</span>
                            )}
                            {asset.links && asset.links.length > 2 && (
                              <span className="text-xs text-slate-400">
                                +{asset.links.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 w-[130px]">
                          {asset.production_url ? (
                            <UrlLink url={asset.production_url} />
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {activeAsset && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setActiveAsset(null)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Asset</p>
                <h2 className="text-lg font-semibold text-slate-900">{activeAsset.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveAsset(null)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {isHtmlContent(activeAsset.description) ? (
                <div
                  className="richtext-body"
                  dangerouslySetInnerHTML={{
                    __html: activeAsset.description || '<p><em>No description provided.</em></p>',
                  }}
                />
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ ...props }) => (
                        <a
                          href={props.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="markdown-link"
                        >
                          {props.children}
                        </a>
                      ),
                      pre: ({ children }) => <pre className="markdown-pre">{children}</pre>,
                      code: ({ children, className }) => {
                        const isInline = !className;
                        if (isInline) {
                          return <code className="markdown-code">{children}</code>;
                        }
                        return <code>{children}</code>;
                      },
                    }}
                  >
                    {activeAsset.description || '_No description provided._'}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
