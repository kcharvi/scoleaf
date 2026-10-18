import { useState, useEffect } from 'react';

export interface PdfSearchResult {
  id: string;
  title: string;
  authors: string[];
  source: 'arxiv';
  pdfUrl: string;
  pageCount?: number;
}

export function usePdfSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PdfSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const handler = setTimeout(() => {
      searchArxiv(query)
        .then((res) => {
          setResults(res.slice(0, 20));
          setLoading(false);
        })
        .catch((e) => {
          setError(e.message || 'Search failed');
          setLoading(false);
        });
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  return { query, setQuery, results, loading, error };
}

// --- arXiv Search ---
async function searchArxiv(query: string): Promise<PdfSearchResult[]> {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${API_BASE_URL}/arxiv-search?query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const text = await res.text();
  // Parse XML
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');
  const entries = Array.from(xml.getElementsByTagName('entry'));
  return entries.map((entry) => {
    const id = entry.getElementsByTagName('id')[0]?.textContent || '';
    const title = entry.getElementsByTagName('title')[0]?.textContent?.replace(/\s+/g, ' ').trim() || '';
    const authors = Array.from(entry.getElementsByTagName('author')).map((a) => a.getElementsByTagName('name')[0]?.textContent || '');
    const links = Array.from(entry.getElementsByTagName('link'));
    let pdfLink = links.find((l: any) => l.getAttribute('type') === 'application/pdf')?.getAttribute('href') || '';
    if (pdfLink.startsWith('http://')) {
      pdfLink = pdfLink.replace('http://', 'https://');
    }
    // arXiv does not provide page count; skip pageCount for now
    return {
      id,
      title,
      authors,
      source: 'arxiv' as const,
      pdfUrl: pdfLink,
    };
  }).filter((r) => r.pdfUrl);
} 