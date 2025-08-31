import { useState } from 'react';

const empty = {
    okul_no: '', ogrenci_no: '', ad: '', soyad: '', tc: '', sinif: '',
    cinsiyet: 'Kız', oturum: 1, kitapcik: 'A', cevaplar: ''
};

export default function AnswerForm({ onSubmit, editing }) {
    const [f, setF] = useState(editing || empty);
    const ch = (k, v) => setF(s => ({ ...s, [k]: v }));

    return (
        <form className="grid grid-cols-2 gap-3" onSubmit={e => { e.preventDefault(); onSubmit(f); }}>
            {['okul_no', 'ogrenci_no', 'ad', 'soyad', 'tc', 'sinif', 'kitapcik'].map(k => (
                <input key={k} value={f[k] || ''} onChange={e => ch(k, e.target.value)} className="border rounded p-2" placeholder={k} />
            ))}
            <select value={f.cinsiyet} onChange={e => ch('cinsiyet', e.target.value)} className="border rounded p-2">
                <option>Kız</option>
                <option>Erkek</option>
            </select>
            <input type="number" value={f.oturum} onChange={e => ch('oturum', Number(e.target.value))} className="border rounded p-2" placeholder="oturum" />
            <textarea value={f.cevaplar} onChange={e => ch('cevaplar', e.target.value)} className="col-span-2 border rounded p-2" rows={4} placeholder="cevaplar" />
            <div className="col-span-2 flex gap-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded">Kaydet</button>
            </div>
        </form>
    );
}