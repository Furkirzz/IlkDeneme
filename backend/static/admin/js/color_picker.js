// static/admin/js/color_picker.js
document.addEventListener('DOMContentLoaded', function () {
    // Renk paleti seçenekleri
    const colorPresets = [
        { name: 'Mavi', value: '#007bff' },
        { name: 'Koyu Mavi', value: '#0056b3' },
        { name: 'Yeşil', value: '#28a745' },
        { name: 'Turkuaz', value: '#17a2b8' },
        { name: 'Sarı', value: '#ffc107' },
        { name: 'Kırmızı', value: '#dc3545' },
        { name: 'Mor', value: '#6f42c1' },
        { name: 'Turuncu', value: '#fd7e14' },
        { name: 'Pembe', value: '#e83e8c' },
    ];

    // Renk paletini oluştur
    const datalist = document.createElement('datalist');
    datalist.id = 'colorPresets';

    colorPresets.forEach(color => {
        const option = document.createElement('option');
        option.value = color.value;
        option.textContent = color.name;
        datalist.appendChild(option);
    });

    document.body.appendChild(datalist);

    // Border color için otomatik koyu ton ayarı
    const bgColorInput = document.getElementById('id_background_color');
    const borderColorInput = document.getElementById('id_border_color');

    bgColorInput.addEventListener('change', function () {
        borderColorInput.value = shadeColor(this.value, -20);
    });

    // Renk tonu fonksiyonu
    function shadeColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;

        const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

        return "#" + RR + GG + BB;
    }
});