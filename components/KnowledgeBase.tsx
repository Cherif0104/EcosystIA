
import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Document } from '../types';
import { summarizeAndCreateDoc } from '../services/geminiService';

interface KnowledgeBaseProps {
    documents: Document[];
    onAddDocument: (doc: Document) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ documents, onAddDocument }) => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSummarize = async () => {
        if (!inputText.trim() || !user) return;
        setLoading(true);
        const result = await summarizeAndCreateDoc(inputText);
        if (result) {
            const newDoc: Document = {
                id: Date.now(),
                title: result.title,
                content: result.content,
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: user.name,
            };
            onAddDocument(newDoc);
            setInputText('');
        }
        setLoading(false);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('knowledge_base_title')}</h1>
            <p className="mt-1 text-gray-600">{t('knowledge_base_subtitle')}</p>

            <div className="mt-8 max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{t('create_doc_from_text')}</h2>
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('paste_text_here')}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    rows={8}
                    disabled={loading}
                />
                <button
                    onClick={handleSummarize}
                    disabled={loading || !inputText.trim()}
                    className="mt-4 w-full bg-emerald-600 text-white py-3 rounded-md font-semibold hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors flex items-center justify-center"
                >
                    {loading ? (
                        <><i className="fas fa-spinner fa-spin mr-2"></i>{t('generating')}</>
                    ) : (
                        <><i className="fas fa-file-invoice mr-2"></i>{t('summarize_and_create')}</>
                    )}
                </button>
            </div>

            <div className="mt-12">
                 <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('all_documents')}</h2>
                 <div className="space-y-6">
                    {documents.map(doc => (
                        <div key={doc.id} className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-lg font-bold text-gray-900">{doc.title}</h3>
                            <p className="text-xs text-gray-500 mt-1 mb-3">By {doc.createdBy} on {doc.createdAt}</p>
                            <p className="text-gray-700 text-sm leading-relaxed">{doc.content}</p>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

export default KnowledgeBase;
