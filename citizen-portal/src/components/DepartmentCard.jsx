import StatusBadge from './StatusBadge';

export default function DepartmentCard({ title, applications, emptyMessage = "No applications found." }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
      </div>
      <div className="px-4 py-5 sm:p-6">
        {(!applications || applications.length === 0) ? (
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {applications.map((app, idx) => (
              <li key={idx} className="py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{app.name || app.title || app.id}</p>
                  <p className="text-sm text-gray-500">{app.description || app.date}</p>
                </div>
                <StatusBadge status={app.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
