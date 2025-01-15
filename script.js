function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function generateImage() {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const fontSize = document.getElementById('fontSizeSlider').value;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const text = document.getElementById('textInput').value;
    context.fillStyle = '#ffffff';
    context.font = `bold ${fontSize}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const maxWidth = canvas.width - 50;
    const lineHeight = parseInt(fontSize) + 10;
    const lines = wrapText(context, text, maxWidth);

    const yStart = canvas.height / 2 - (lines.length / 2) * lineHeight;
    lines.forEach((line, i) => {
        context.fillText(line, canvas.width / 2, yStart + i * lineHeight);
    });

    const preview = document.getElementById('preview');
    preview.src = canvas.toDataURL('image/png');
}

const debouncedGenerateImage = debounce(generateImage, 300);

function downloadImage() {
    const canvas = document.getElementById('canvas');
    const link = document.createElement('a');
    link.download = 'Quo [amogenz].png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function wrapText(context, text, maxWidth) {
    const lines = [];
    const paragraphs = text.split('\n');

    paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ');
        let line = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && i > 0) {
                lines.push(line);
                line = words[i] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
    });
    return lines;
}
function toggleTextarea() {
    const textarea = document.getElementById('textInput');
    textarea.style.display = (textarea.style.display === 'none') ? 'block' : 'none';
}

// Panggil generateImage saat halaman dimuat
window.onload = generateImage;