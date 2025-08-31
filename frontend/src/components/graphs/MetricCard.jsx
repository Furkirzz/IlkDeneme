export default function MetricCard({ title, value, sub, color = 'blue' }) {
    const colorVariants = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
        red: 'from-red-500 to-red-600',
        indigo: 'from-indigo-500 to-indigo-600'
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 min-w-[220px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${colorVariants[color]} rounded-xl flex items-center justify-center shadow-lg`}>
                    <div className="text-white text-xl font-bold">
                        {title.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
            {sub && <div className="text-sm text-gray-500">{sub}</div>}
        </div>
    );
}