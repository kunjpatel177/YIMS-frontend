import React from 'react';

const MetricCard = ({ title, value, unit = '', icon = 'fa-chart-line', color = 'primary', subtitle = '' }) => {
  return (
    <div className="card card-custom h-100 p-3">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <div className="text-secondary small fw-semibold text-uppercase tracking-wider">{title}</div>
          <div className="fs-3 fw-bold text-dark mt-1">
            {value} <span className="fs-6 fw-normal text-muted">{unit}</span>
          </div>
          {subtitle && <div className="small text-muted mt-1">{subtitle}</div>}
        </div>
        <div
          className={`metric-icon-box bg-${color} bg-opacity-10 text-${color} border border-${color} border-opacity-25`}
        >
          <i className={`fas ${icon}`}></i>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
