import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface EarlyAccessSignup {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  firm_name: string | null;
  role: string | null;
  state: string | null;
  phone: string | null;
  comments: string | null;
  created_at: string;
}

const EarlyAccessManagement: React.FC = () => {
  const { data: signups, isLoading, error } = useQuery({
    queryKey: ['early-access-signups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('early_access_signups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EarlyAccessSignup[];
    }
  });

  const totalSignups = signups?.length || 0;
  const attorneySignups = signups?.filter(s => s.role === 'attorney').length || 0;
  const texasSignups = signups?.filter(s => s.state === 'texas').length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-red-600">
            Error loading early access signups: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Signups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSignups}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attorneys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attorneySignups}</div>
            <p className="text-xs text-muted-foreground">
              {totalSignups > 0 ? Math.round((attorneySignups / totalSignups) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Texas Users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{texasSignups}</div>
            <p className="text-xs text-muted-foreground">
              {totalSignups > 0 ? Math.round((texasSignups / totalSignups) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Signups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Early Access Signups</CardTitle>
          <CardDescription>
            All users who have signed up for early access and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signups && signups.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Name</TableHead>
                    <TableHead className="w-[180px]">Email</TableHead>
                    <TableHead className="w-[150px]">Firm</TableHead>
                    <TableHead className="w-[80px]">Role</TableHead>
                    <TableHead className="w-[60px]">State</TableHead>
                    <TableHead className="w-[120px]">Phone</TableHead>
                    <TableHead>Comments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signups.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell className="font-medium">
                        {signup.first_name} {signup.last_name}
                      </TableCell>
                      <TableCell>{signup.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {signup.firm_name || '-'}
                      </TableCell>
                      <TableCell>
                        {signup.role ? (
                          <Badge variant="secondary" className="capitalize">
                            {signup.role.replace('_', ' ')}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {signup.state ? (
                          <Badge variant={signup.state === 'texas' ? 'default' : 'outline'}>
                            {signup.state === 'texas' ? 'TX' : 'Other'}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{signup.phone || '-'}</TableCell>
                      <TableCell className="max-w-[300px]">
                        {signup.comments ? (
                          <div className="truncate" title={signup.comments}>
                            {signup.comments}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No early access signups yet.
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default EarlyAccessManagement;