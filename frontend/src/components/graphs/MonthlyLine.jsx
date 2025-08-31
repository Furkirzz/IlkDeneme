import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

export function MonthlyLine({ data }) {
    const fmt = (s) => new Date(s).toLocaleDateString('tr-TR', { month: 'short' });
    return (
        <div className="bg-white rounded-2xl shadow p-4 h-80">
            <div className="font-medium mb-2">Kayıt Eğrisi</div>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <XAxis dataKey="month" tickFormatter={fmt} />
                    <YAxis allowDecimals={false} />
                    <Tooltip labelFormatter={fmt} />
                    <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#1D4ED8' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function PieBlock({ title, data, labelKey = 'cinsiyet' }) {
    // Çeşitli renkler tanımlayalım
    const COLORS = [
        '#3B82F6',  // Blue
        '#EF4444',  // Red
        '#10B981',  // Green
        '#F59E0B',  // Amber
        '#8B5CF6',  // Purple
        '#06B6D4',  // Cyan
        '#F97316',  // Orange
        '#84CC16'   // Lime
    ];

    return (
        <div className="bg-white rounded-2xl shadow p-4 h-80">
            <div className="font-medium mb-2">{title}</div>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie 
                        data={data} 
                        dataKey="value" 
                        nameKey={labelKey} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}