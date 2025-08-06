import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Database, 
  Brain, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnrichmentStats {
  total_cases: number;
  cases_with_embeddings: number;
  cases_with_concepts: number;
  cases_needing_enrichment: number;
  last_enrichment_run: string | null;
}

interface JobRun {
  id: string;
  job_name: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  processed_count: number;
  error_count: number;
  metadata: any;
}

const BackgroundEnrichmentDashboard: React.FC = () => {
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_enrichment_stats' as any);

      if (statsError) throw statsError;
      
      if (statsData && (statsData as any).length > 0) {
        setStats((statsData as any)[0]);
      }
    } catch (error: any) {
      console.error("Error fetching enrichment stats:", error);
      toast({
        title: "Error",
        description: "Failed to load enrichment statistics",
        variant: "destructive",
      });
    }
  };

  const fetchRecentJobs = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('background_job_runs' as any)
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (jobsError) throw jobsError;
      setRecentJobs((jobsData || []) as any);
    } catch (error: any) {
      console.error("Error fetching recent jobs:", error);
    }
  };

  const runEnrichmentJob = async (operation: 'embeddings' | 'concepts' | 'all' = 'all') => {
    setRunningJob(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-global-cases', {
        body: {
          operation,
          batchSize: 25
        }
      });

      if (error) throw error;

      toast({
        title: "Enrichment Job Started",
        description: `Processing ${operation} for global case dataset`,
      });

      // Refresh stats and jobs after a short delay
      setTimeout(() => {
        fetchStats();
        fetchRecentJobs();
      }, 2000);

    } catch (error: any) {
      console.error("Error running enrichment job:", error);
      toast({
        title: "Job Failed",
        description: error.message || "Failed to start enrichment job",
        variant: "destructive",
      });
    } finally {
      setRunningJob(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRecentJobs()]);
      setLoading(false);
    };

    loadData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentJobs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>;
      case 'running':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Running
        </Badge>;
      case 'completed_with_errors':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Errors
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${Math.round(duration / 1000)}s`;
    return `${Math.round(duration / 60000)}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Background Enrichment
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats();
              fetchRecentJobs();
            }}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <div className="flex items-center justify-center mb-2">
                    <Database className="h-4 w-4 mr-1 text-blue-600" />
                    <span className="text-sm font-medium text-muted-foreground">Total Cases</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.total_cases.toLocaleString()}
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center justify-center mb-2">
                    <Brain className="h-4 w-4 mr-1 text-green-600" />
                    <span className="text-sm font-medium text-muted-foreground">With Embeddings</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.cases_with_embeddings.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.total_cases > 0 ? 
                      `${Math.round((Number(stats.cases_with_embeddings) / Number(stats.total_cases)) * 100)}%` 
                      : '0%'
                    }
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="h-4 w-4 mr-1 text-purple-600" />
                    <span className="text-sm font-medium text-muted-foreground">With Concepts</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.cases_with_concepts.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.total_cases > 0 ? 
                      `${Math.round((Number(stats.cases_with_concepts) / Number(stats.total_cases)) * 100)}%` 
                      : '0%'
                    }
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-4 w-4 mr-1 text-orange-600" />
                    <span className="text-sm font-medium text-muted-foreground">Need Enrichment</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.cases_needing_enrichment.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Cases pending</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  onClick={() => runEnrichmentJob('all')}
                  disabled={runningJob}
                  className="flex items-center gap-1"
                >
                  <Play className="h-4 w-4" />
                  Run Full Enrichment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runEnrichmentJob('embeddings')}
                  disabled={runningJob}
                  className="flex items-center gap-1"
                >
                  <Brain className="h-4 w-4" />
                  Embeddings Only
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runEnrichmentJob('concepts')}
                  disabled={runningJob}
                  className="flex items-center gap-1"
                >
                  <Activity className="h-4 w-4" />
                  Concepts Only
                </Button>
              </div>

              {stats.cases_needing_enrichment > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {stats.cases_needing_enrichment} cases are pending enrichment. 
                    Run a background job to generate embeddings and extract legal concepts.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Recent Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No background jobs have been run yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getJobStatusBadge(job.status)}
                    <div>
                      <div className="font-medium">{job.job_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(job.started_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>
                      {job.processed_count} processed
                      {job.error_count > 0 && (
                        <span className="text-destructive ml-1">
                          ({job.error_count} errors)
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {formatDuration(job.started_at, job.completed_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackgroundEnrichmentDashboard;