'use client';

import { usePDFReport } from '@/lib/usePDFReport';
import { Button } from '@/components/ui/Button';

interface ReportDownloadProps {
  type: 'market' | 'subnet';
  subnetId?: number;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ReportDownload({
  type,
  subnetId,
  variant = 'secondary',
  size = 'md',
  className = '',
}: ReportDownloadProps) {
  const { loading, error, downloadMarketReport, downloadSubnetReport } = usePDFReport();

  const handleClick = async () => {
    if (type === 'market') {
      await downloadMarketReport();
    } else if (type === 'subnet' && subnetId) {
      await downloadSubnetReport(subnetId);
    }
  };

  const label = type === 'market' ? 'Download Market Report' : 'Download Subnet Report';

  return (
    <div className={className}>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        isLoading={loading}
        disabled={loading || (type === 'subnet' && !subnetId)}
      >
        📄 {label}
      </Button>
      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
