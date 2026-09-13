import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  let bgClass = 'bg-secondary';
  let icon = '';

  switch (status.toLowerCase()) {
    case 'completed':
    case 'active':
    case 'available':
    case 'in stock':
      bgClass = 'bg-success text-white';
      icon = 'fa-check-circle';
      break;
    case 'pending':
      bgClass = 'bg-warning text-dark';
      icon = 'fa-clock';
      break;
    case 'cancelled':
    case 'inactive':
    case 'out of stock':
      bgClass = 'bg-danger text-white';
      icon = 'fa-times-circle';
      break;
    case 'low stock':
    case 'reorder required':
      bgClass = 'bg-warning text-dark';
      icon = 'fa-exclamation-triangle';
      break;
    default:
      bgClass = 'bg-secondary text-white';
  }

  return (
    <span className={`badge badge-custom ${bgClass} d-inline-flex align-items-center gap-1`}>
      {icon && <i className={`fas ${icon} fa-xs`}></i>}
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
