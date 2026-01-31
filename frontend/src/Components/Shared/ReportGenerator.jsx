import React, { useState } from 'react';
import { FaDownload, FaFileAlt, FaFilePdf, FaFileExcel, FaCalendarAlt, FaSpinner } from 'react-icons/fa';
import { analyticsApi } from '../../api/analyticsApi';
import Toast from './Toast';

const ReportGenerator = () => {
  const [timePeriod, setTimePeriod] = useState('last30days');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [reportTypes, setReportTypes] = useState({
    summary: true,
    financial: true,
    orders: true,
    users: true,
    vendors: true,
    services: true,
    reviews: true,
    categories: true,
  });
  const [exportFormat, setExportFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  const [reportData, setReportData] = useState(null);

  const getDateRange = () => {
    const now = new Date();
    let from, to;

    switch (timePeriod) {
      case 'today':
        from = new Date(now.setHours(0, 0, 0, 0));
        to = new Date();
        break;
      case 'yesterday':
        from = new Date(now.setDate(now.getDate() - 1));
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        from = new Date(now.setDate(now.getDate() - 7));
        to = new Date();
        break;
      case 'last30days':
        from = new Date(now.setDate(now.getDate() - 30));
        to = new Date();
        break;
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date();
        break;
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date();
        break;
      case 'lastYear':
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'custom':
        from = new Date(customDateFrom);
        to = new Date(customDateTo);
        break;
      default:
        from = new Date(now.setDate(now.getDate() - 30));
        to = new Date();
    }

    return { from, to };
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      const { from, to } = getDateRange();

      if (timePeriod === 'custom' && (!customDateFrom || !customDateTo)) {
        setToast({ type: 'error', message: 'Please select both start and end dates' });
        return;
      }

      // Get selected report types
      const selectedTypes = Object.entries(reportTypes)
        .filter(([_, checked]) => checked)
        .map(([type, _]) => type);

      if (selectedTypes.length === 0) {
        setToast({ type: 'error', message: 'Please select at least one report section' });
        return;
      }

      // Call backend API
      const response = await analyticsApi.generateReport({
        dateFrom: from.toISOString().split('T')[0],
        dateTo: to.toISOString().split('T')[0],
        reportTypes: selectedTypes,
        format: exportFormat === 'pdf' ? 'json' : exportFormat, // PDF handled on frontend
      });

      if (exportFormat === 'csv') {
        // Backend returns CSV text directly
        downloadCSVFromBackend(response.data || response);
      } else {
        // JSON format - process and display
        const reportData = response.data?.report || response.report;
        setReportData(reportData);
        setToast({ type: 'success', message: 'Report generated successfully!' });

        // If PDF format, generate from JSON data
        if (exportFormat === 'pdf') {
          downloadPDF(reportData, response.data?.reportMetadata || response.reportMetadata);
        } else {
          // JSON download
          downloadJSON(response.data || response);
        }
      }
    } catch (err) {
      console.error('Report generation error:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to generate report';
      setToast({ type: 'error', message: errorMessage });
    } finally {
      setGenerating(false);
    }
  };

  const downloadJSON = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSVFromBackend = (csvText) => {
    const blob = new Blob([csvText], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (data, metadata) => {
    const { from, to } = getDateRange();
    const periodLabel = metadata?.dateFrom && metadata?.dateTo 
      ? `${new Date(metadata.dateFrom).toLocaleDateString()} to ${new Date(metadata.dateTo).toLocaleDateString()}`
      : getPeriodLabel();

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #1B4B36; border-bottom: 3px solid #1B4B36; padding-bottom: 10px; }
          h2 { color: #1B4B36; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #1B4B36; }
          .card .label { font-size: 12px; color: #666; text-transform: uppercase; }
          .card .value { font-size: 24px; font-weight: bold; color: #1B4B36; margin-top: 5px; }
          .change { font-size: 14px; margin-top: 5px; }
          .change.positive { color: #10b981; }
          .change.negative { color: #ef4444; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #1B4B36; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f8f9fa; }
          .period { background: #FCDE70; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Somadhan Ache Analytics</h1>
        <div class="period">📅 Period: ${periodLabel}</div>
        ${metadata?.generatedAt ? `<p style="color: #666; font-size: 14px;">Generated: ${new Date(metadata.generatedAt).toLocaleString()}</p>` : ''}
        
        ${data.summary ? `
        <h2>Executive Summary</h2>
        <div class="summary">
          <div class="card">
            <div class="label">Total Revenue</div>
            <div class="value">৳${data.summary.totalRevenue?.toFixed(2) || '0.00'}</div>
            ${data.summary.revenueChange ? `<div class="change ${data.summary.revenueChange >= 0 ? 'positive' : 'negative'}">
              ${data.summary.revenueChange >= 0 ? '↑' : '↓'} ${Math.abs(data.summary.revenueChange).toFixed(1)}%
            </div>` : ''}
          </div>
          <div class="card">
            <div class="label">Total Orders</div>
            <div class="value">${data.summary.totalOrders || 0}</div>
            ${data.summary.ordersChange ? `<div class="change ${data.summary.ordersChange >= 0 ? 'positive' : 'negative'}">
              ${data.summary.ordersChange >= 0 ? '↑' : '↓'} ${Math.abs(data.summary.ordersChange).toFixed(1)}%
            </div>` : ''}
          </div>
          <div class="card">
            <div class="label">Completion Rate</div>
            <div class="value">${data.summary.completionRate?.toFixed(1) || '0.0'}%</div>
          </div>
          <div class="card">
            <div class="label">Active Users</div>
            <div class="value">${data.summary.activeUsers || 0}</div>
            ${data.summary.usersChange ? `<div class="change ${data.summary.usersChange >= 0 ? 'positive' : 'negative'}">
              ${data.summary.usersChange >= 0 ? '↑' : '↓'} ${Math.abs(data.summary.usersChange).toFixed(1)}%
            </div>` : ''}
          </div>
          <div class="card">
            <div class="label">Active Vendors</div>
            <div class="value">${data.summary.activeVendors || 0}</div>
            ${data.summary.vendorsChange ? `<div class="change ${data.summary.vendorsChange >= 0 ? 'positive' : 'negative'}">
              ${data.summary.vendorsChange >= 0 ? '↑' : '↓'} ${Math.abs(data.summary.vendorsChange).toFixed(1)}%
            </div>` : ''}
          </div>
          <div class="card">
            <div class="label">Average Rating</div>
            <div class="value">${data.summary.averageRating?.toFixed(2) || '0.00'} ⭐</div>
          </div>
        </div>
        ` : ''}

        ${data.financial ? `
        <h2>Financial Summary</h2>
        <table>
          <tr><td><strong>Total Revenue</strong></td><td><strong>৳${data.financial.revenueBreakdown?.platformCommission ? (data.financial.revenueBreakdown.platformCommission + data.financial.revenueBreakdown.vendorPayouts).toFixed(2) : (data.financial.paymentStatus?.reduce((sum, p) => sum + p.total, 0) || 0).toFixed(2)}</strong></td></tr>
          ${data.financial.revenueBreakdown ? `
            <tr><td>Platform Commission</td><td>৳${data.financial.revenueBreakdown.platformCommission?.toFixed(2) || '0.00'}</td></tr>
            <tr><td>Vendor Payouts</td><td>৳${data.financial.revenueBreakdown.vendorPayouts?.toFixed(2) || '0.00'}</td></tr>
          ` : ''}
          ${data.financial.refunds ? `
            <tr><td>Refunds</td><td>৳${data.financial.refunds.total?.toFixed(2) || '0.00'} (${data.financial.refunds.count || 0} refunds)</td></tr>
          ` : ''}
        </table>

        ${data.financial.revenueBreakdown?.byMethod?.length > 0 ? `
        <h3>Revenue by Payment Method</h3>
        <table>
          <thead><tr><th>Method</th><th>Count</th><th>Total</th></tr></thead>
          <tbody>
            ${data.financial.revenueBreakdown.byMethod.map(m => `
              <tr><td>${m._id}</td><td>${m.count}</td><td>৳${m.total.toFixed(2)}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${data.financial.topVendors?.length > 0 ? `
        <h3>Top Vendors (by Revenue)</h3>
        <table>
          <thead><tr><th>Vendor</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>
            ${data.financial.topVendors.map(v => `
              <tr><td>${v.vendorName}</td><td>${v.orders}</td><td>৳${v.revenue.toFixed(2)}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${data.financial.topServices?.length > 0 ? `
        <h3>Top Services (by Revenue)</h3>
        <table>
          <thead><tr><th>Service</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>
            ${data.financial.topServices.map(s => `
              <tr><td>${s.serviceName}</td><td>${s.orders}</td><td>৳${s.revenue.toFixed(2)}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        ` : ''}

        ${data.orders ? `
        <h2>Order Analytics</h2>
        <table>
          <tr><td><strong>Total Orders</strong></td><td><strong>${data.orders.total || 0}</strong></td></tr>
          <tr><td>Average Order Value</td><td>৳${data.orders.averageOrderValue?.toFixed(2) || '0.00'}</td></tr>
          <tr><td>Completion Rate</td><td>${data.orders.completionRate?.toFixed(1) || '0.0'}%</td></tr>
        </table>

        ${data.orders.byStatus?.length > 0 ? `
        <h3>Orders by Status</h3>
        <table>
          <thead><tr><th>Status</th><th>Count</th><th>Total Value</th></tr></thead>
          <tbody>
            ${data.orders.byStatus.map(s => `
              <tr><td style="text-transform: capitalize;">${s._id}</td><td>${s.count}</td><td>৳${s.totalValue?.toFixed(2) || '0.00'}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${data.orders.byCategory?.length > 0 ? `
        <h3>Orders by Category</h3>
        <table>
          <thead><tr><th>Category</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>
            ${data.orders.byCategory.map(c => `
              <tr><td>${c.categoryName || c._id}</td><td>${c.orders || c.count}</td><td>৳${c.revenue?.toFixed(2) || '0.00'}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        ` : ''}

        ${data.users ? `
        <h2>User Analytics</h2>
        <table>
          <tr><td>New Users</td><td>${data.users.newUsers || 0}</td></tr>
          <tr><td>Active Users (with orders)</td><td>${data.users.activeUsers || 0}</td></tr>
        </table>

        ${data.users.byRole?.length > 0 ? `
        <h3>Users by Role</h3>
        <table>
          <thead><tr><th>Role</th><th>Count</th></tr></thead>
          <tbody>
            ${data.users.byRole.map(r => `
              <tr><td style="text-transform: capitalize;">${r._id}</td><td>${r.count}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        ` : ''}

        ${data.vendors ? `
        <h2>Vendor Analytics</h2>
        <table>
          <tr><td>New Vendors</td><td>${data.vendors.newVendors || 0}</td></tr>
          <tr><td>Active Vendors</td><td>${data.vendors.activeVendors || 0}</td></tr>
        </table>

        ${data.vendors.topVendors?.length > 0 ? `
        <h3>Top Performing Vendors</h3>
        <table>
          <thead><tr><th>Vendor</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>
            ${data.vendors.topVendors.map(v => `
              <tr><td>${v.vendorName}</td><td>${v.totalOrders}</td><td>৳${v.totalRevenue?.toFixed(2) || '0.00'}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        ` : ''}

        ${data.services ? `
        <h2>Service Analytics</h2>
        <table>
          <tr><td>New Services</td><td>${data.services.newServices || 0}</td></tr>
        </table>

        ${data.services.byCategory?.length > 0 ? `
        <h3>Services by Category</h3>
        <table>
          <thead><tr><th>Category</th><th>Count</th></tr></thead>
          <tbody>
            ${data.services.byCategory.map(c => `
              <tr><td>${c.categoryName || c._id}</td><td>${c.count}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${data.services.topServices?.length > 0 ? `
        <h3>Most Booked Services</h3>
        <table>
          <thead><tr><th>Service</th><th>Bookings</th></tr></thead>
          <tbody>
            ${data.services.topServices.map(s => `
              <tr><td>${s.serviceName}</td><td>${s.bookings}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        ` : ''}

        ${data.reviews ? `
        <h2>Review Analytics</h2>
        <table>
          <tr><td>Total Reviews</td><td>${data.reviews.total || 0}</td></tr>
          <tr><td>Average Rating</td><td>${data.reviews.averageRating?.toFixed(2) || '0.00'} ⭐</td></tr>
        </table>

        ${data.reviews.distribution?.length > 0 ? `
        <h3>Rating Distribution</h3>
        <table>
          <thead><tr><th>Rating</th><th>Count</th></tr></thead>
          <tbody>
            ${data.reviews.distribution.sort((a, b) => b._id - a._id).map(d => `
              <tr><td>${d._id} ⭐</td><td>${d.count}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        ` : ''}

        ${data.categories?.performance?.length > 0 ? `
        <h2>Category Performance</h2>
        <table>
          <thead><tr><th>Category</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>
            ${data.categories.performance.map(c => `
              <tr><td>${c.categoryName}</td><td>${c.orders}</td><td>৳${c.revenue.toFixed(2)}</td></tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="footer">
          Generated on ${new Date().toLocaleString()} | Practicum Platform
        </div>
      </body>
      </html>
    `;

    // Create a new window and print
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      // Don't close immediately - let user save as PDF
    }, 500);
  };

  const getPeriodLabel = () => {
    const labels = {
      today: 'Today',
      yesterday: 'Yesterday',
      last7days: 'Last 7 Days',
      last30days: 'Last 30 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisYear: 'This Year',
      lastYear: 'Last Year',
      custom: `${customDateFrom} to ${customDateTo}`,
    };
    return labels[timePeriod] || 'Custom Period';
  };

  const toggleReportType = (type) => {
    setReportTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="bg-white border rounded-lg p-6 space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <FaFileAlt className="text-2xl text-[#1B4B36]" />
        <div>
          <h3 className="text-xl font-bold text-gray-900">Generate Analytics Report</h3>
          <p className="text-sm text-gray-600">Export comprehensive analytics data</p>
        </div>
      </div>

      {/* Time Period Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 font-semibold text-gray-700">
          <FaCalendarAlt className="text-[#1B4B36]" />
          Time Period
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear'].map(period => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                timePeriod === period
                  ? 'bg-[#1B4B36] text-white border-[#1B4B36]'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-[#1B4B36]'
              }`}
            >
              {period.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        <button
          onClick={() => setTimePeriod('custom')}
          className={`w-full px-4 py-2 rounded-lg border transition-colors ${
            timePeriod === 'custom'
              ? 'bg-[#1B4B36] text-white border-[#1B4B36]'
              : 'bg-white text-gray-700 border-gray-300 hover:border-[#1B4B36]'
          }`}
        >
          Custom Date Range
        </button>

        {timePeriod === 'custom' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Report Type Selection */}
      <div className="space-y-3">
        <label className="font-semibold text-gray-700">Report Sections</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(reportTypes).map(([type, checked]) => (
            <label key={type} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleReportType(type)}
                className="checkbox checkbox-sm border-[#1B4B36] [--chkbg:#1B4B36] [--chkfg:white]"
              />
              <span className="capitalize text-gray-700">
                {type === 'categories' ? 'Category Performance' : `${type} Report`}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Export Format */}
      <div className="space-y-3">
        <label className="font-semibold text-gray-700">Export Format</label>
        <div className="flex gap-4">
          {[
            { value: 'pdf', icon: FaFilePdf, label: 'PDF' },
            { value: 'csv', icon: FaFileExcel, label: 'Excel/CSV' },
          ].map(({ value, icon: Icon, label }) => (
            <label key={value} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 flex-1">
              <input
                type="radio"
                name="format"
                value={value}
                checked={exportFormat === value}
                onChange={(e) => setExportFormat(e.target.value)}
                className="radio radio-sm border-[#1B4B36] [--chkbg:#1B4B36]"
              />
              <Icon className="text-[#1B4B36]" />
              <span className="text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateReport}
        disabled={generating}
        className="w-full btn bg-[#1B4B36] text-white hover:bg-[#2d7a54] disabled:bg-gray-400"
      >
        {generating ? (
          <>
            <FaSpinner className="animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <FaDownload />
            Generate & Download Report
          </>
        )}
      </button>

      {/* Preview Stats */}
      {reportData && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-3">📊 Report Preview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {reportData.summary && (
              <>
                <div>
                  <p className="text-gray-600">Revenue</p>
                  <p className="text-lg font-bold text-green-700">৳{reportData.summary.totalRevenue?.toFixed(2) || '0.00'}</p>
                  {reportData.summary.revenueChange && (
                    <p className={`text-xs ${reportData.summary.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.summary.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(reportData.summary.revenueChange).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600">Orders</p>
                  <p className="text-lg font-bold text-green-700">{reportData.summary.totalOrders || 0}</p>
                  {reportData.summary.ordersChange && (
                    <p className={`text-xs ${reportData.summary.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.summary.ordersChange >= 0 ? '↑' : '↓'} {Math.abs(reportData.summary.ordersChange).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600">Users</p>
                  <p className="text-lg font-bold text-green-700">{reportData.summary.activeUsers || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Rating</p>
                  <p className="text-lg font-bold text-green-700">{reportData.summary.averageRating?.toFixed(2) || '0.00'} ⭐</p>
                </div>
              </>
            )}
            {!reportData.summary && reportData.orders && (
              <div className="col-span-4 text-center text-gray-600">
                <p>Report generated successfully with {Object.keys(reportData).length} section(s)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ReportGenerator;
