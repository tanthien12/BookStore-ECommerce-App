// frontend/src/api/uploadApi.js
import summaryApi, { API_URL } from '../common';

export async function uploadSingle(file, bucket /* 'product'|'user'|'category' */) {
    const fd = new FormData();
    fd.append('file', file);
    const url = API_URL + summaryApi.upload[bucket].single;
    const res = await fetch(url, { method: 'POST', body: fd });
    return res.json();
}

export async function uploadMultiple(files, bucket) {
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('files', f));
    const url = API_URL + summaryApi.upload[bucket].multiple;
    const res = await fetch(url, { method: 'POST', body: fd });
    return res.json();
}

export async function removeUpload(bucket, fileName) {
    const res = await fetch(API_URL + summaryApi.upload.remove, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket, fileName }),
    });
    return res.json();
}
