import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Contact } from '../types';
import { draftSalesEmail } from '../services/geminiService';
import ConfirmationModal from './common/ConfirmationModal';

const statusStyles = {
    'Lead': 'bg-blue-100 text-blue-800',
    'Contacted': 'bg-yellow-100 text-yellow-800',
    'Prospect': 'bg-purple-100 text-purple-800',
    'Customer': 'bg-green-100 text-green-800',
};

const ContactFormModal: React.FC<{
    contact: Contact | null;
    onClose: () => void;
    onSave: (contact: Contact | Omit<Contact, 'id'>) => void;
}> = ({ contact, onClose, onSave }) => {
    const { t } = useLocalization();
    const isEditMode = contact !== null;
    const [formData, setFormData] = useState({
        name: contact?.name || '',
        company: contact?.company || '',
        status: contact?.status || 'Lead',
        avatar: contact?.avatar || `https://picsum.photos/seed/${Date.now()}/100/100`,
        officePhone: contact?.officePhone || '',
        mobilePhone: contact?.mobilePhone || '',
        whatsappNumber: contact?.whatsappNumber || '',
        workEmail: contact?.workEmail || '',
        personalEmail: contact?.personalEmail || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...(isEditMode && { id: contact.id }),
            ...formData
        };
        onSave(dataToSave as Contact);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b"><h2 className="text-xl font-bold">{isEditMode ? t('edit_contact') : t('create_contact')}</h2></div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('contact_name')}</label>
                                <input name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('contact_company')}</label>
                                <input name="company" value={formData.company} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('work_email')}</label>
                                <input type="email" name="workEmail" value={formData.workEmail} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('personal_email')}</label>
                                <input type="email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('office_phone')}</label>
                                <input type="tel" name="officePhone" value={formData.officePhone} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('mobile_phone')}</label>
                                <input type="tel" name="mobilePhone" value={formData.mobilePhone} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('whatsapp_number')}</label>
                            <input type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('contact_status')}</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                <option value="Lead">{t('lead')}</option>
                                <option value="Contacted">{t('contacted')}</option>
                                <option value="Prospect">{t('prospect')}</option>
                                <option value="Customer">{t('customer')}</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">{t('cancel')}</button>
                        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const EmailDraftModal: React.FC<{ contact: Contact; onClose: () => void; emailBody: string; isLoading: boolean }> = ({ contact, onClose, emailBody, isLoading }) => {
    const { t } = useLocalization();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">Draft Email to {contact.name}</h2>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                         <div className="flex justify-center items-center min-h-[200px]">
                            <i className="fas fa-spinner fa-spin text-3xl text-emerald-500"></i>
                        </div>
                    ) : (
                        <textarea
                            className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                            defaultValue={emailBody}
                        />
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Close</button>
                    <button onClick={onClose} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700">Send Email</button>
                </div>
            </div>
        </div>
    );
};

interface CRMProps {
    contacts: Contact[];
    onAddContact: (contact: Omit<Contact, 'id'>) => void;
    onUpdateContact: (contact: Contact) => void;
    onDeleteContact: (contactId: number) => void;
}

const CRM: React.FC<CRMProps> = ({ contacts, onAddContact, onUpdateContact, onDeleteContact }) => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const [view, setView] = useState<'list' | 'pipeline'>('list');
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [emailBody, setEmailBody] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact|null>(null);
    const [deletingContactId, setDeletingContactId] = useState<number|null>(null);

    const canManage = user?.role === 'administrator' || user?.role === 'manager';
    
    const pipelineStatuses: Contact['status'][] = ['Lead', 'Contacted', 'Prospect', 'Customer'];

    const handleDraftEmail = async (contact: Contact) => {
        if (!user) return;
        setSelectedContact(contact);
        setIsLoading(true);
        const body = await draftSalesEmail(contact, user);
        setEmailBody(body);
        setIsLoading(false);
    };

    const handleCloseModal = () => {
        setSelectedContact(null);
        setEmailBody('');
    };
    
    const handleSaveContact = (contactData: Contact | Omit<Contact, 'id'>) => {
        if ('id' in contactData) {
            onUpdateContact(contactData);
        } else {
            onAddContact(contactData);
        }
        setFormModalOpen(false);
        setEditingContact(null);
    };

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact);
        setFormModalOpen(true);
    };
    
    const handleDelete = (contactId: number) => {
        onDeleteContact(contactId);
        setDeletingContactId(null);
    }
    
    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, contactId: number) => {
        e.dataTransfer.setData("contactId", contactId.toString());
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: Contact['status']) => {
        e.preventDefault();
        const contactId = Number(e.dataTransfer.getData("contactId"));
        const contactToMove = contacts.find(c => c.id === contactId);
        if (contactToMove && contactToMove.status !== newStatus) {
            onUpdateContact({ ...contactToMove, status: newStatus });
        }
        e.currentTarget.classList.remove('bg-emerald-100');
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-emerald-100');
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-emerald-100');
    };


    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{t('crm_title')}</h1>
                    <p className="mt-1 text-gray-600">{t('crm_subtitle')}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="p-1 bg-gray-200 rounded-lg">
                        <button onClick={() => setView('list')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'list' ? 'bg-white shadow' : 'text-gray-600'}`}>{t('list_view')}</button>
                        <button onClick={() => setView('pipeline')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'pipeline' ? 'bg-white shadow' : 'text-gray-600'}`}>{t('pipeline_view')}</button>
                    </div>
                    {canManage && (
                        <button onClick={() => setFormModalOpen(true)} className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 flex items-center">
                           <i className="fas fa-plus mr-2"></i> {t('create_contact')}
                        </button>
                    )}
                </div>
            </div>
            
            {view === 'list' && (
                <div className="mt-8 bg-white rounded-lg shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">{t('contact_name')}</th>
                                    <th scope="col" className="px-6 py-3">{t('contact_company')}</th>
                                    <th scope="col" className="px-6 py-3">{t('contact_status')}</th>
                                    <th scope="col" className="px-6 py-3 text-right">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map(contact => (
                                    <tr key={contact.id} className="bg-white border-b hover:bg-gray-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center">
                                            <img src={contact.avatar} alt={contact.name} className="w-8 h-8 rounded-full mr-3"/>
                                            {contact.name}
                                        </th>
                                        <td className="px-6 py-4">{contact.company}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${statusStyles[contact.status]}`}>{t(contact.status.toLowerCase())}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleDraftEmail(contact)} className="font-medium text-emerald-600 hover:text-emerald-800" title={t('draft_email_with_ai')}><i className="fas fa-magic"></i></button>
                                             {canManage && (
                                                <>
                                                    <button onClick={() => handleEdit(contact)} className="font-medium text-blue-600 hover:text-blue-800">{t('edit')}</button>
                                                    <button onClick={() => setDeletingContactId(contact.id)} className="font-medium text-red-600 hover:text-red-800">{t('delete')}</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'pipeline' && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {pipelineStatuses.map(status => (
                        <div 
                            key={status} 
                            className="bg-gray-100 rounded-lg p-3 transition-colors"
                            onDrop={(e) => handleDrop(e, status)}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <h3 className={`font-semibold text-sm uppercase p-2 ${statusStyles[status]} bg-opacity-40`}>{t(status.toLowerCase())}</h3>
                            <div className="mt-4 space-y-3 min-h-[100px]">
                                {contacts.filter(c => c.status === status).map(contact => (
                                    <div 
                                        key={contact.id} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, contact.id)}
                                        className="bg-white p-3 rounded-md shadow cursor-grab"
                                    >
                                        <p className="font-bold text-sm text-gray-800">{contact.name}</p>
                                        <p className="text-xs text-gray-500">{contact.company}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedContact && <EmailDraftModal contact={selectedContact} onClose={handleCloseModal} emailBody={emailBody} isLoading={isLoading} />}
            {isFormModalOpen && <ContactFormModal contact={editingContact} onClose={() => {setFormModalOpen(false); setEditingContact(null);}} onSave={handleSaveContact} />}
            {deletingContactId !== null && <ConfirmationModal title={t('delete_contact')} message={t('confirm_delete_message')} onConfirm={() => handleDelete(deletingContactId)} onCancel={() => setDeletingContactId(null)} />}
        </div>
    );
};

export default CRM;