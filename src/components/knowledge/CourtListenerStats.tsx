import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, TrendingUp, Clock, Target, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSearchStats } from "@/utils/api/globalCaseSearchService";

interface SearchStats {
  totalCases: number;
  totalCacheEntries: number;
  cacheHitRate: number;
  avgFetchCount: number;
}

const CourtListenerStats: React.FC = () => {
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const statsData = await getSearchStats();
      setStats(statsData);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Error fetching CourtListener stats:", err);
      setError(err.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getCacheEfficiencyLevel = (hitRate: number): { label: string; variant: "default" | "secondary" | "destructive" } => {
    if (hitRate >= 70) return { label: "Excellent", variant: "default" };
    if (hitRate >= 50) return { label: "Good", variant: "secondary" };
    return { label: "Improving", variant: "destructive" };
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Database className="h-5 w-5 mr-2 text-blue-600" />
          CourtListener Dataset Statistics
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Database className="h-4 w-4 mr-1 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">Total Cases</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(stats.totalCases)}
                </div>
                <div className="text-xs text-muted-foreground">Legal opinions cached</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-4 w-4 mr-1 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">Cache Entries</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(stats.totalCacheEntries)}
                </div>
                <div className="text-xs text-muted-foreground">Search queries cached</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-4 w-4 mr-1 text-purple-600" />
                  <span className="text-sm font-medium text-muted-foreground">Cache Hit Rate</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.cacheHitRate.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  <Badge variant={getCacheEfficiencyLevel(stats.cacheHitRate).variant} className="text-xs">
                    {getCacheEfficiencyLevel(stats.cacheHitRate).label}
                  </Badge>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-4 w-4 mr-1 text-orange-600" />
                  <span className="text-sm font-medium text-muted-foreground">Avg API Use</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.avgFetchCount.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Times per case</div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex flex-wrap gap-2 items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Global cache-first search enabled</span>
                  <Badge variant="outline" className="text-xs">
                    Live Dataset
                  </Badge>
                </div>
                {lastUpdated && (
                  <span>
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default CourtListenerStats;