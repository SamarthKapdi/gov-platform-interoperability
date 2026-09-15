export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';

  if (['approved', 'resolved', 'active', 'granted'].includes(normalized)) {
    bgColor = 'bg-green-100';
    textColor = 'text-green-800';
  } else if (['under_review', 'in_progress', 'pending'].includes(normalized)) {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-800';
  } else if (['submitted', 'new'].includes(normalized)) {
    bgColor = 'bg-blue-100';
    textColor = 'text-blue-800';
  } else if (['rejected', 'revoked', 'expired'].includes(normalized)) {
    bgColor = 'bg-red-100';
    textColor = 'text-red-800';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
    </span>
  );
}
