import React from 'react';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';

const ExportButtons = ({ data = [], headers = [], title = 'Report', filename = 'export' }) => {
  const handleCSV = () => {
    exportToCSV(data, `${filename}.csv`);
  };

  const handleExcel = () => {
    exportToExcel(data, `${filename}.xlsx`, title.slice(0, 30));
  };

  const handlePDF = () => {
    if (!data.length) {
      alert('No data available to export');
      return;
    }
    const pdfHeaders = headers.length ? headers : Object.keys(data[0]);
    const pdfRows = data.map((row) => pdfHeaders.map((h) => row[h] !== undefined ? String(row[h]) : ''));
    exportToPDF(pdfHeaders, pdfRows, title, `${filename}.pdf`);
  };

  return (
    <div className="btn-group btn-group-sm" role="group">
      <button
        type="button"
        className="btn btn-outline-secondary d-flex align-items-center gap-1"
        onClick={handleCSV}
        title="Export to CSV"
        disabled={!data || data.length === 0}
      >
        <i className="fas fa-file-csv text-success"></i>
        <span>CSV</span>
      </button>
      <button
        type="button"
        className="btn btn-outline-secondary d-flex align-items-center gap-1"
        onClick={handleExcel}
        title="Export to Excel"
        disabled={!data || data.length === 0}
      >
        <i className="fas fa-file-excel text-success"></i>
        <span>Excel</span>
      </button>
      <button
        type="button"
        className="btn btn-outline-secondary d-flex align-items-center gap-1"
        onClick={handlePDF}
        title="Export to PDF"
        disabled={!data || data.length === 0}
      >
        <i className="fas fa-file-pdf text-danger"></i>
        <span>PDF</span>
      </button>
    </div>
  );
};

export default ExportButtons;
