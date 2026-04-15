export function downloadBlob(blob: Blob, filename: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 0);
}
