'use client';

import { useState } from 'react';

type CSVExportButtonProps = {
  month?: string;
};

export default function CSVExportButton({ month }: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return; // 2重クリック防止

    setIsExporting(true);

    try {
      const exportMonth = month || new Date().toISOString().slice(0, 7);
      const url = `/api/exports/entries.csv?month=${exportMonth}`;

      // ファイルダウンロード
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('CSV export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `entries_${exportMonth}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('CSV export error:', error);
      alert('CSVエクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`px-4 py-2 rounded-md transition-colors ${
        isExporting
          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700'
      }`}
    >
      {isExporting ? 'エクスポート中...' : '当月CSVエクスポート'}
    </button>
  );
}
