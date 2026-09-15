import React from 'react';

const StatusBadge = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800';
  let formattedStatus = status || 'UNKNOWN';
  
  const s = formattedStatus.toUpperCase();
  
  if (s === 'OPEN' || s === 'ERROR' || s === 'FAILED' || s === 'REJECTED') {
    colorClass = 'bg-red-100 text-red-800';
  } else if (s === 'RESOLVED' || s === 'SUCCESS' || s === 'COMPLETED' || s === 'APPROVED') {
    colorClass = 'bg-green-100 text-green-800';
  } else if (s === 'PENDING' || s === 'IN_PROGRESS' || s === 'UNDER_REVIEW') {
    colorClass = 'bg-yellow-100 text-yellow-800';
  } else if (s === 'IGNORED' || s === 'DRAFT') {
    colorClass = 'bg-gray-100 text-gray-600';
  } else if (s === 'SUBMITTED') {
    colorClass = 'bg-blue-100 text-blue-800';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {formattedStatus.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
