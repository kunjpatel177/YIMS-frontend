import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export data array to CSV
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  data.forEach((row) => {
    const values = headers.map((header) => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data array to Excel (.xlsx) using SheetJS
 */
export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet 1') => {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

/**
 * Export tabular data to PDF using jsPDF and autoTable
 */
export const exportToPDF = (headers, rows, title = 'Report', filename = 'export.pdf') => {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape' });

  // Title & Header
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text('Yashvee Inventory Management System (YIMS)', 14, 15);

  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`${title} - Generated on ${new Date().toLocaleString()}`, 14, 22);

  // Table
  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 26,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};
