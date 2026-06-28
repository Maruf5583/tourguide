import LoadingSpinner from '../common/LoadingSpinner'

export default function DataTable({ columns, data, loading, emptyText = 'No data found' }) {
  if (loading) return <LoadingSpinner center />
  if (!data?.length) return (
    <div className="text-center py-12 text-gray-400 text-sm">{emptyText}</div>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th key={col.key} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide py-3 px-4">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4 text-gray-700">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}