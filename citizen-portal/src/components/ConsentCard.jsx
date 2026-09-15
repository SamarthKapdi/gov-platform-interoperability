import { useState } from 'react';
import StatusBadge from './StatusBadge';

export default function ConsentCard({ consent, onRevoke }) {
  const [loading, setLoading] = useState(false);
  const isActive = consent.status === 'ACTIVE' || consent.status === 'GRANTED';

  const handleRevoke = async () => {
    setLoading(true);
    await onRevoke(consent.id);
    setLoading(false);
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 mb-4">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {consent.requestingDept} requesting from {consent.grantingDept}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Scope: {consent.dataScope.join(', ')}
          </p>
        </div>
        <StatusBadge status={consent.status} />
      </div>
      <div className="border-t border-gray-200 px-4 py-4 sm:px-6 flex justify-between items-center bg-gray-50">
        <div className="text-sm text-gray-500">
          <p>Purpose: {consent.purpose}</p>
          <p>Expires: {new Date(consent.expiresAt).toLocaleDateString()}</p>
        </div>
        {isActive && (
          <button
            onClick={handleRevoke}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? 'Revoking...' : 'Revoke Consent'}
          </button>
        )}
      </div>
    </div>
  );
}
