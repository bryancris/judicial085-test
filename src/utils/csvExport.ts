import { format } from 'date-fns';

export interface EarlyAccessSignup {
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

export const exportEarlyAccessSignupsToCSV = (signups: EarlyAccessSignup[]) => {
  // CSV headers
  const headers = [
    'Name',
    'Email', 
    'Firm',
    'Role',
    'State',
    'Phone',
    'Comments',
    'Signup Date'
  ];

  // Convert data to CSV rows
  const csvRows = signups.map(signup => [
    `${signup.first_name} ${signup.last_name}`,
    signup.email,
    signup.firm_name || '',
    signup.role ? signup.role.replace('_', ' ') : '',
    signup.state || '',
    signup.phone || '',
    signup.comments || '',
    format(new Date(signup.created_at), 'MM/dd/yyyy HH:mm:ss')
  ]);

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.map(escapeCSVValue).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `early-access-signups-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};