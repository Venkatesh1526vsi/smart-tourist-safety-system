import { useEffect, useState } from "react";
import { Newspaper, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPuneSafetyNews } from "@/services/api";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
}

const PuneSafetyNewsWidget = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPuneSafetyNews();
        // Handle both wrapped {data: [...]} and direct response formats
        const articlesData = response.data || response || [];
        if (Array.isArray(articlesData)) {
          setArticles(articlesData);
        } else {
          console.warn('[PuneSafetyNewsWidget] Unexpected data format:', articlesData);
          setArticles([]);
        }
      } catch (err) {
        console.error('[PuneSafetyNewsWidget] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load news');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    
    // Refresh news every 30 minutes
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown';
      
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffHours < 48) return 'Yesterday';
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card className="dark:bg-slate-800/60 dark:border-slate-700/50">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading safety alerts...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="dark:bg-slate-800/60 dark:border-slate-700/50">
        <CardContent className="p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-muted-foreground">Unable to load safety alerts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-slate-800/60 dark:border-slate-700/50 dark:backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Newspaper className="h-5 w-5 text-blue-500" />
          Live Safety Alerts – Pune
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-3">
            {articles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No safety alerts at this time
              </p>
            ) : (
              articles.map((article, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium line-clamp-2 flex-1">
                      {article.title || 'Untitled'}
                    </h4>
                    {article.url && article.url !== '#' && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {article.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500">{article.source || 'Unknown'}</span>
                    <span className="text-xs text-slate-400">{formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PuneSafetyNewsWidget;
