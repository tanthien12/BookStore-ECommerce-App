// frontend/src/components/common/ImageUploader.jsx
import React, { useState } from 'react';
import { uploadSingle, uploadMultiple, removeUpload } from '../../api/uploadApi';

/**
 * props:
 * - bucket: 'product' | 'user' | 'category'
 * - multiple: boolean
 * - value: [{ url, fileName, bucket }]
 * - onChange: (arr) => void
 */
export default function ImageUploader({ bucket = 'product', multiple = true, value = [], onChange }) {
    const [items, setItems] = useState(value);

    async function onSelect(e) {
        const files = e.target.files;
        if (!files?.length) return;

        const res = multiple ? await uploadMultiple(files, bucket) : await uploadSingle(files[0], bucket);
        const data = multiple ? (res?.data || []) : (res?.data ? [res.data] : []);
        const next = [...items, ...data];
        setItems(next);
        onChange?.(next);
    }

    async function removeAt(idx) {
        const it = items[idx];
        await removeUpload(it.bucket, it.fileName);
        const next = items.filter((_, i) => i !== idx);
        setItems(next);
        onChange?.(next);
    }

    return (
        <div className="space-y-3">
            <input type="file" accept="image/*" multiple={multiple} onChange={onSelect} />
            <div className="flex flex-wrap gap-3">
                {items.map((p, i) => (
                    <div key={i} className="relative w-28 h-28 border rounded overflow-hidden">
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => removeAt(i)}
                            className="absolute top-1 right-1 bg-white/90 px-1 rounded text-xs"
                            aria-label="remove"
                            title="Xoá ảnh"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
