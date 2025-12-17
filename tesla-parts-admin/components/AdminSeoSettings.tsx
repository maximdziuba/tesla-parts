import React, { useEffect, useState } from 'react';
import { ApiService } from '../services/api';
import { Check, Loader } from 'lucide-react';

interface SeoRecord {
    id: number;
    slug: string;
    meta_title: string;
    meta_description: string;
}

const AdminSeoSettings: React.FC = () => {
    const [seoRecords, setSeoRecords] = useState<SeoRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<{[key: string]: boolean}>({});

    useEffect(() => {
        const fetchSeoData = async () => {
            try {
                const data = await ApiService.getStaticSeo();
                setSeoRecords(data);
            } catch (error) {
                console.error("Failed to fetch SEO data", error);
                alert("Failed to load SEO settings.");
            } finally {
                setLoading(false);
            }
        };
        fetchSeoData();
    }, []);

    const handleUpdate = (slug: string, field: 'meta_title' | 'meta_description', value: string) => {
        setSeoRecords(prev => 
            prev.map(record => 
                record.slug === slug ? { ...record, [field]: value } : record
            )
        );
    };

    const handleSave = async (slug: string) => {
        const record = seoRecords.find(r => r.slug === slug);
        if (!record) return;

        setSaving(prev => ({ ...prev, [slug]: true }));
        try {
            await ApiService.updateStaticSeo(slug, {
                meta_title: record.meta_title,
                meta_description: record.meta_description
            });
            // Optional: show a success message
        } catch (error) {
            console.error(`Failed to save SEO for ${slug}`, error);
            alert(`Failed to save settings for ${slug}.`);
        } finally {
            setTimeout(() => {
                setSaving(prev => ({ ...prev, [slug]: false }));
            }, 1000);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading SEO Settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">SEO for Static Pages</h1>
            <div className="space-y-6">
                {seoRecords.map(record => (
                    <div key={record.slug} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold capitalize mb-4 text-gray-700">{record.slug.replace(/_/g, ' ')} Page</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Meta Title</label>
                                <input
                                    type="text"
                                    value={record.meta_title}
                                    onChange={(e) => handleUpdate(record.slug, 'meta_title', e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-tesla-red outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Meta Description</label>
                                <textarea
                                    value={record.meta_description}
                                    onChange={(e) => handleUpdate(record.slug, 'meta_description', e.target.value)}
                                    className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-tesla-red outline-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="text-right mt-4">
                            <button
                                onClick={() => handleSave(record.slug)}
                                disabled={saving[record.slug]}
                                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {saving[record.slug] ? <Loader size={20} className="animate-spin mx-auto" /> : 'Зберегти'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminSeoSettings;
