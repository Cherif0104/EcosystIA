import React, { useState, useMemo } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Invoice, Expense, Receipt, RecurringInvoice, RecurringExpense, RecurrenceFrequency, Budget, Project, BudgetLine, BudgetItem } from '../types';
import ConfirmationModal from './common/ConfirmationModal';

const statusStyles: { [key in Invoice['status']]: string } = {
    'Draft': 'bg-gray-200 text-gray-800',
    'Sent': 'bg-blue-200 text-blue-800',
    'Paid': 'bg-emerald-200 text-emerald-800',
    'Overdue': 'bg-red-200 text-red-800',
    'Partially Paid': 'bg-yellow-200 text-yellow-800',
};

const StatCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
    <div className={`text-3xl ${color}`}><i className={icon}></i></div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const ReceiptViewerModal: React.FC<{ receipt: Receipt; onClose: () => void; }> = ({ receipt, onClose }) => {
    const isImage = receipt.dataUrl.startsWith('data:image/');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[70] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold truncate">{receipt.fileName}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><i className="fas fa-times"></i></button>
                </div>
                <div className="p-6 flex-grow overflow-auto flex justify-center items-center">
                    {isImage ? (
                        <img src={receipt.dataUrl} alt={receipt.fileName} className="max-w-full max-h-full object-contain" />
                    ) : (
                        <div className="text-center">
                            <i className="fas fa-file-alt text-5xl text-gray-400 mb-4"></i>
                            <p>Preview is not available for this file type.</p>
                            <a href={receipt.dataUrl} download={receipt.fileName} className="mt-4 inline-block bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700">
                                Download {receipt.fileName}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const InvoiceFormModal: React.FC<{
    invoice: Invoice | null;
    onClose: () => void;
    onSave: (invoice: Invoice | Omit<Invoice, 'id'>) => void;
    onSaveRecurring: (data: Omit<RecurringInvoice, 'id'>) => void;
}> = ({ invoice, onClose, onSave, onSaveRecurring }) => {
    const { t } = useLocalization();
    const isEditMode = invoice !== null;
    const [isRecurring, setIsRecurring] = useState(false);
    
    const [formData, setFormData] = useState({
        invoiceNumber: invoice?.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        clientName: invoice?.clientName || '',
        amount: invoice?.amount || '',
        dueDate: invoice?.dueDate || '',
        status: invoice?.status || 'Draft',
        paidAmount: invoice?.paidAmount || '',
    });

    const [recurringData, setRecurringData] = useState({
        frequency: 'Monthly' as RecurrenceFrequency,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
    });

    const [receipt, setReceipt] = useState<Receipt | null>(invoice?.receipt || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setReceipt({
                    fileName: file.name,
                    dataUrl: loadEvent.target?.result as string,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value }));
    };

    const handleRecurringChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setRecurringData(prev => ({...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isRecurring) {
            onSaveRecurring({
                clientName: formData.clientName,
                amount: Number(formData.amount),
                frequency: recurringData.frequency,
                startDate: recurringData.startDate,
                endDate: recurringData.endDate || undefined,
                lastGeneratedDate: new Date(recurringData.startDate).toISOString().split('T')[0],
            });
        } else {
            const isNowPaid = formData.status === 'Paid' && (!invoice || invoice.status !== 'Paid');
            const dataToSave = {
                ...formData,
                amount: Number(formData.amount),
                paidAmount: formData.status === 'Partially Paid' ? Number(formData.paidAmount) : undefined,
                receipt: receipt || undefined,
                paidDate: isNowPaid ? new Date().toISOString().split('T')[0] : (invoice?.paidDate || undefined),
            };
            onSave(isEditMode ? { ...invoice, ...dataToSave } as Invoice : dataToSave as Omit<Invoice, 'id'>);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b"><h2 className="text-xl font-bold">{isEditMode ? t('edit_invoice') : t('create_invoice')}</h2></div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('client_name')}</label>
                                <input name="clientName" value={formData.clientName} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">{t('amount')}</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                            </div>
                        </div>

                        {!isRecurring && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('invoice_number')}</label>
                                        <input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md bg-gray-100" readOnly/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('due_date')}</label>
                                        <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                                    </div>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('status')}</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                        <option value="Draft">{t('draft')}</option>
                                        <option value="Sent">{t('sent')}</option>
                                        <option value="Partially Paid">{t('partially_paid')}</option>
                                        <option value="Paid">{t('paid')}</option>
                                        <option value="Overdue">{t('overdue')}</option>
                                    </select>
                                </div>
                                {formData.status === 'Partially Paid' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('paid_amount')}</label>
                                        <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                                    </div>
                                )}
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('receipt')}</label>
                                    {receipt ? (
                                        <div className="mt-1 flex items-center justify-between p-2 border rounded-md bg-gray-50">
                                            <span className="text-sm truncate">{receipt.fileName}</span>
                                            <button type="button" onClick={() => setReceipt(null)} className="ml-2 text-red-500 hover:text-red-700 text-xs font-bold">{t('remove_receipt')}</button>
                                        </div>
                                    ) : (
                                        <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
                                    )}
                                </div>
                            </>
                        )}
                        
                        {!isEditMode && (
                             <div className="pt-4 border-t">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"/>
                                    <span className="text-sm font-medium text-gray-700">{t('make_recurring')}</span>
                                </label>
                            </div>
                        )}
                       
                        {isRecurring && (
                            <div className="space-y-4 pt-4 border-t border-dashed">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('frequency')}</label>
                                    <select name="frequency" value={recurringData.frequency} onChange={handleRecurringChange} className="mt-1 block w-full p-2 border rounded-md">
                                        <option value="Monthly">{t('monthly')}</option>
                                        <option value="Quarterly">{t('quarterly')}</option>
                                        <option value="Annually">{t('annually')}</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('start_date')}</label>
                                        <input type="date" name="startDate" value={recurringData.startDate} onChange={handleRecurringChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('end_date_optional')}</label>
                                        <input type="date" name="endDate" value={recurringData.endDate} onChange={handleRecurringChange} className="mt-1 block w-full p-2 border rounded-md"/>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">{t('cancel')}</button>
                        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const ExpenseFormModal: React.FC<{
    expense: Expense | null;
    budgets: Budget[];
    onClose: () => void;
    onSave: (expense: Expense | Omit<Expense, 'id'>) => void;
    onSaveRecurring: (data: Omit<RecurringExpense, 'id'>) => void;
}> = ({ expense, budgets, onClose, onSave, onSaveRecurring }) => {
    const { t } = useLocalization();
    const isEditMode = expense !== null;
    const [isRecurring, setIsRecurring] = useState(false);

    const [formData, setFormData] = useState({
        category: expense?.category || 'Software',
        description: expense?.description || '',
        amount: expense?.amount || '',
        date: expense?.date || new Date().toISOString().split('T')[0],
        dueDate: expense?.dueDate || '',
        status: expense?.status || 'Unpaid',
        budgetItemId: expense?.budgetItemId || '',
    });
    
     const [recurringData, setRecurringData] = useState({
        frequency: 'Monthly' as RecurrenceFrequency,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
    });

    const [receipt, setReceipt] = useState<Receipt | null>(expense?.receipt || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setReceipt({
                    fileName: file.name,
                    dataUrl: loadEvent.target?.result as string,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value }));
    };

     const handleRecurringChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setRecurringData(prev => ({...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
         if (isRecurring) {
            onSaveRecurring({
                category: formData.category,
                description: formData.description,
                amount: Number(formData.amount),
                frequency: recurringData.frequency,
                startDate: recurringData.startDate,
                endDate: recurringData.endDate || undefined,
                lastGeneratedDate: new Date(recurringData.startDate).toISOString().split('T')[0],
            });
        } else {
            const dataToSave = {
                ...formData,
                amount: Number(formData.amount),
                status: formData.status as 'Unpaid' | 'Paid',
                dueDate: formData.dueDate || undefined,
                budgetItemId: formData.budgetItemId || undefined,
                receipt: receipt || undefined,
            };
            onSave(isEditMode ? { ...expense, ...dataToSave } : dataToSave);
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b"><h2 className="text-xl font-bold">{isEditMode ? t('edit_expense') : t('create_expense')}</h2></div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                             <label className="block text-sm font-medium text-gray-700">{t('description')}</label>
                             <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="mt-1 block w-full p-2 border rounded-md" required/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('category')}</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                    <option>Software</option>
                                    <option>Office Supplies</option>
                                    <option>Marketing</option>
                                    <option>Utilities</option>
                                    <option>Travel</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('amount')}</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                            </div>
                        </div>

                        {!isRecurring && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('date')}</label>
                                        <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('payable_by')} (Optional)</label>
                                        <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('status')}</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                        <option value="Unpaid">{t('unpaid')}</option>
                                        <option value="Paid">{t('paid')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('link_to_budget')}</label>
                                    <select name="budgetItemId" value={formData.budgetItemId} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                        <option value="">{t('no_budget')}</option>
                                        {budgets.map(b => (
                                            <optgroup key={b.id} label={b.title}>
                                                {b.budgetLines.map(line => (
                                                    line.items.map(item => (
                                                        <option key={item.id} value={item.id}>
                                                            {line.title} - {item.description}
                                                        </option>
                                                    ))
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('receipt')}</label>
                                    {receipt ? (
                                        <div className="mt-1 flex items-center justify-between p-2 border rounded-md bg-gray-50">
                                            <span className="text-sm truncate">{receipt.fileName}</span>
                                            <button type="button" onClick={() => setReceipt(null)} className="ml-2 text-red-500 hover:text-red-700 text-xs font-bold">{t('remove_receipt')}</button>
                                        </div>
                                    ) : (
                                        <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
                                    )}
                                </div>
                            </>
                        )}
                        
                        {!isEditMode && (
                             <div className="pt-4 border-t">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"/>
                                    <span className="text-sm font-medium text-gray-700">{t('make_recurring')}</span>
                                </label>
                            </div>
                        )}

                        {isRecurring && (
                            <div className="space-y-4 pt-4 border-t border-dashed">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('frequency')}</label>
                                    <select name="frequency" value={recurringData.frequency} onChange={handleRecurringChange} className="mt-1 block w-full p-2 border rounded-md">
                                        <option value="Monthly">{t('monthly')}</option>
                                        <option value="Quarterly">{t('quarterly')}</option>
                                        <option value="Annually">{t('annually')}</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('start_date')}</label>
                                        <input type="date" name="startDate" value={recurringData.startDate} onChange={handleRecurringChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('end_date_optional')}</label>
                                        <input type="date" name="endDate" value={recurringData.endDate} onChange={handleRecurringChange} className="mt-1 block w-full p-2 border rounded-md"/>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">{t('cancel')}</button>
                        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const BudgetFormModal: React.FC<{
    budget: Budget | null;
    projects: Project[];
    onClose: () => void;
    onSave: (budget: Budget | Omit<Budget, 'id'>) => void;
}> = ({ budget, projects, onClose, onSave }) => {
    const { t } = useLocalization();
    const isEditMode = budget !== null;

    const [formData, setFormData] = useState({
        title: budget?.title || '',
        type: budget?.type || 'Project' as 'Project' | 'Office',
        amount: budget?.amount || '',
        startDate: budget?.startDate || '',
        endDate: budget?.endDate || '',
        projectId: budget?.projectId || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value }));
        if(name === 'type' && value === 'Office') {
            setFormData(prev => ({...prev, projectId: ''}));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            amount: Number(formData.amount),
            projectId: formData.projectId ? Number(formData.projectId) : undefined,
            budgetLines: budget?.budgetLines || []
        };
        onSave(isEditMode ? { ...budget, ...dataToSave } as Budget : dataToSave as Omit<Budget, 'id'>);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b"><h2 className="text-xl font-bold">{isEditMode ? t('edit_budget') : t('create_budget')}</h2></div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('budget_title')}</label>
                            <input name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('budget_type')}</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md">
                                    <option value="Project">{t('project_budget')}</option>
                                    <option value="Office">{t('office_management')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('total_budget')}</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                            </div>
                        </div>
                        {formData.type === 'Project' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('select_project')}</label>
                                <select name="projectId" value={formData.projectId} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required>
                                    <option value="" disabled>{t('select_project')}</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('start_date')}</label>
                                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700">{t('end_date')}</label>
                                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                            </div>
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

const BudgetDetailModal: React.FC<{
    budget: Budget;
    expenses: Expense[];
    onClose: () => void;
    onUpdateBudget: (budget: Budget) => void;
}> = ({ budget, expenses, onClose, onUpdateBudget }) => {
    const { t } = useLocalization();
    const [editedBudget, setEditedBudget] = useState(budget);

    const handleLineChange = (lineIndex: number, newTitle: string) => {
        const newLines = [...editedBudget.budgetLines];
        newLines[lineIndex].title = newTitle;
        setEditedBudget({ ...editedBudget, budgetLines: newLines });
    };

    const handleItemChange = (lineIndex: number, itemIndex: number, field: 'description' | 'amount', value: string | number) => {
        const newLines = [...editedBudget.budgetLines];
        (newLines[lineIndex].items[itemIndex] as any)[field] = value;
        setEditedBudget({ ...editedBudget, budgetLines: newLines });
    };
    
    const addLine = () => {
        const newLine: BudgetLine = { id: `bl-${Date.now()}`, title: 'New Budget Line', items: [] };
        setEditedBudget({ ...editedBudget, budgetLines: [...editedBudget.budgetLines, newLine] });
    };

    const addItem = (lineIndex: number) => {
        const newItem: BudgetItem = { id: `bi-${Date.now()}`, description: 'New Item', amount: 0 };
        const newLines = [...editedBudget.budgetLines];
        newLines[lineIndex].items.push(newItem);
        setEditedBudget({ ...editedBudget, budgetLines: newLines });
    };
    
    const removeLine = (lineIndex: number) => {
        const newLines = editedBudget.budgetLines.filter((_, i) => i !== lineIndex);
        setEditedBudget({ ...editedBudget, budgetLines: newLines });
    };
    
    const removeItem = (lineIndex: number, itemIndex: number) => {
        const newLines = [...editedBudget.budgetLines];
        newLines[lineIndex].items = newLines[lineIndex].items.filter((_, i) => i !== itemIndex);
        setEditedBudget({ ...editedBudget, budgetLines: newLines });
    };
    
    const calculateSpent = (itemId: string) => expenses.filter(e => e.budgetItemId === itemId).reduce((sum, e) => sum + e.amount, 0);

    const handleSave = () => {
        onUpdateBudget(editedBudget);
        onClose();
    };

    const totalSpent = useMemo(() => {
        const allItemIds = new Set(editedBudget.budgetLines.flatMap(l => l.items.map(i => i.id)));
        return expenses.filter(e => e.budgetItemId && allItemIds.has(e.budgetItemId)).reduce((sum, e) => sum + e.amount, 0);
    }, [editedBudget, expenses]);
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">{editedBudget.title}</h2>
                    <div className="flex space-x-4 text-sm mt-2">
                        <span><strong>{t('total_budget')}:</strong> ${editedBudget.amount.toFixed(2)}</span>
                        <span><strong>{t('amount_spent')}:</strong> ${totalSpent.toFixed(2)}</span>
                        <span className={editedBudget.amount - totalSpent < 0 ? 'text-red-500' : 'text-green-500'}><strong>{t('remaining')}:</strong> ${(editedBudget.amount - totalSpent).toFixed(2)}</span>
                    </div>
                </div>
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <h3 className="text-lg font-bold">{t('budget_lines')}</h3>
                    {editedBudget.budgetLines.map((line, lIndex) => (
                        <div key={line.id} className="p-4 border rounded-md bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <input value={line.title} onChange={e => handleLineChange(lIndex, e.target.value)} className="text-md font-semibold p-1 border-b w-full bg-transparent focus:outline-none focus:border-emerald-500" />
                                <button onClick={() => removeLine(lIndex)} className="ml-4 text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                            </div>
                            <table className="w-full text-sm mt-2">
                                <thead className="text-left text-gray-500">
                                    <tr>
                                        <th className="py-1">{t('item_description')}</th>
                                        <th className="py-1 w-28 text-right">{t('planned_amount')}</th>
                                        <th className="py-1 w-28 text-right">{t('actual_spent')}</th>
                                        <th className="py-1 w-28 text-right">{t('remaining')}</th>
                                        <th className="py-1 w-12 text-center">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {line.items.map((item, iIndex) => {
                                        const spent = calculateSpent(item.id);
                                        const remaining = item.amount - spent;
                                        return (
                                        <tr key={item.id}>
                                            <td><input value={item.description} onChange={e => handleItemChange(lIndex, iIndex, 'description', e.target.value)} className="w-full p-1 bg-transparent focus:outline-none focus:bg-white rounded-md"/></td>
                                            <td className="text-right"><input type="number" value={item.amount} onChange={e => handleItemChange(lIndex, iIndex, 'amount', Number(e.target.value))} className="w-24 p-1 text-right bg-transparent focus:outline-none focus:bg-white rounded-md"/></td>
                                            <td className="text-right">${spent.toFixed(2)}</td>
                                            <td className={`text-right font-semibold ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>${remaining.toFixed(2)}</td>
                                            <td className="text-center"><button onClick={() => removeItem(lIndex, iIndex)} className="text-gray-400 hover:text-red-500"><i className="fas fa-times-circle"></i></button></td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                            <button onClick={() => addItem(lIndex)} className="text-xs text-emerald-600 hover:text-emerald-800 mt-2"><i className="fas fa-plus mr-1"></i> {t('add_budget_item')}</button>
                        </div>
                    ))}
                    <button onClick={addLine} className="w-full border-dashed border-2 p-2 rounded-md hover:bg-gray-100 text-sm"><i className="fas fa-plus mr-2"></i>{t('add_budget_line')}</button>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">{t('cancel')}</button>
                    <button type="button" onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700">{t('save')}</button>
                </div>
            </div>
        </div>
    )
};

interface FinanceProps {
  invoices: Invoice[];
  expenses: Expense[];
  recurringInvoices: RecurringInvoice[];
  recurringExpenses: RecurringExpense[];
  budgets: Budget[];
  projects: Project[];
  onAddInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: number) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: number) => void;
  onAddRecurringInvoice: (data: Omit<RecurringInvoice, 'id'>) => void;
  onUpdateRecurringInvoice: (data: RecurringInvoice) => void;
  onDeleteRecurringInvoice: (id: number) => void;
  onAddRecurringExpense: (data: Omit<RecurringExpense, 'id'>) => void;
  onUpdateRecurringExpense: (data: RecurringExpense) => void;
  onDeleteRecurringExpense: (id: number) => void;
  onAddBudget: (budget: Omit<Budget, 'id'>) => void;
  onUpdateBudget: (budget: Budget) => void;
  onDeleteBudget: (budgetId: number) => void;
}

const Finance: React.FC<FinanceProps> = (props) => {
    const { 
        invoices, expenses, recurringInvoices, recurringExpenses, budgets, projects,
        onAddInvoice, onUpdateInvoice, onDeleteInvoice, 
        onAddExpense, onUpdateExpense, onDeleteExpense,
        onAddRecurringInvoice, onUpdateRecurringInvoice, onDeleteRecurringInvoice,
        onAddRecurringExpense, onUpdateRecurringExpense, onDeleteRecurringExpense,
        onAddBudget, onUpdateBudget, onDeleteBudget
    } = props;
    const { t } = useLocalization();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'recurring' | 'budgets'>('invoices');
    const [activeRecurringTab, setActiveRecurringTab] = useState<'invoices' | 'expenses'>('invoices');
    
    const [isInvoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [isExpenseModalOpen, setExpenseModalOpen] = useState(false);
    const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
    const [isBudgetDetailModalOpen, setBudgetDetailModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);
    const [deletingId, setDeletingId] = useState<{type: 'invoice' | 'expense' | 'recurringInvoice' | 'recurringExpense' | 'budget', id: number} | null>(null);
    const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

    // Dashboard Metrics Calculations
    const totalRevenue = useMemo(() => {
        const paidInvoices = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
        const partiallyPaidInvoices = invoices.filter(inv => inv.status === 'Partially Paid').reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
        return paidInvoices + partiallyPaidInvoices;
    }, [invoices]);

    const totalExpenses = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
    const netIncome = totalRevenue - totalExpenses;
    
    const totalOutstandingInvoices = useMemo(() => {
        return invoices.reduce((sum, inv) => {
            switch(inv.status) {
                case 'Sent':
                case 'Overdue':
                    return sum + inv.amount;
                case 'Partially Paid':
                    return sum + (inv.amount - (inv.paidAmount || 0));
                default: // Draft, Paid
                    return sum;
            }
        }, 0);
    }, [invoices]);

    const totalDueExpenses = useMemo(() => {
        return expenses
            .filter(exp => exp.status === 'Unpaid')
            .reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses]);

    const averagePaymentTime = useMemo(() => {
        const paidInvoices = invoices.filter(inv => inv.status === 'Paid' && inv.paidDate);
        if (paidInvoices.length === 0) {
            return null;
        }

        const totalDaysDiff = paidInvoices.reduce((sum, inv) => {
            const dueDate = new Date(inv.dueDate);
            const paidDate = new Date(inv.paidDate!);
            const diffTime = paidDate.getTime() - dueDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return sum + diffDays;
        }, 0);

        return Math.round(totalDaysDiff / paidInvoices.length);
    }, [invoices]);

    const budgetsWithSpent = useMemo(() => {
        return budgets.map(budget => {
            const allItemIds = new Set(budget.budgetLines.flatMap(l => l.items.map(i => i.id)));
            const spent = expenses
                .filter(exp => exp.budgetItemId && allItemIds.has(exp.budgetItemId))
                .reduce((sum, exp) => sum + exp.amount, 0);
            return { ...budget, spentAmount: spent };
        });
    }, [budgets, expenses]);

    const canManage = user?.role === 'manager' || user?.role === 'administrator' || user?.role === 'super_administrator';
    
    const handleOpenInvoiceModal = (invoice: Invoice | null = null) => {
        setEditingInvoice(invoice);
        setInvoiceModalOpen(true);
    }
    const handleOpenExpenseModal = (expense: Expense | null = null) => {
        setEditingExpense(expense);
        setExpenseModalOpen(true);
    }
    const handleOpenBudgetModal = (budget: Budget | null = null) => {
        setEditingBudget(budget);
        setBudgetModalOpen(true);
    }
    const handleOpenBudgetDetailModal = (budget: Budget) => {
        setViewingBudget(budget);
        setBudgetDetailModalOpen(true);
    };

    const handleSaveInvoice = (data: Invoice | Omit<Invoice, 'id'>) => {
        if('id' in data) { onUpdateInvoice(data); }
        else { onAddInvoice(data); }
        setInvoiceModalOpen(false);
    }
    
    const handleSaveExpense = (data: Expense | Omit<Expense, 'id'>) => {
        if('id' in data) { onUpdateExpense(data); }
        else { onAddExpense(data); }
        setExpenseModalOpen(false);
    }

    const handleSaveBudget = (data: Budget | Omit<Budget, 'id'>) => {
        if('id' in data) { onUpdateBudget(data); }
        else { onAddBudget(data); }
        setBudgetModalOpen(false);
    }
    
    const handleSaveRecurringInvoice = (data: Omit<RecurringInvoice, 'id'>) => {
        onAddRecurringInvoice(data);
        setInvoiceModalOpen(false);
    };

    const handleSaveRecurringExpense = (data: Omit<RecurringExpense, 'id'>) => {
        onAddRecurringExpense(data);
        setExpenseModalOpen(false);
    };
    
    const confirmDelete = () => {
        if(!deletingId) return;
        if(deletingId.type === 'invoice') { onDeleteInvoice(deletingId.id); }
        else if (deletingId.type === 'expense') { onDeleteExpense(deletingId.id); }
        else if (deletingId.type === 'recurringInvoice') { onDeleteRecurringInvoice(deletingId.id); }
        else if (deletingId.type === 'recurringExpense') { onDeleteRecurringExpense(deletingId.id); }
        else if (deletingId.type === 'budget') { onDeleteBudget(deletingId.id); }
        setDeletingId(null);
    }
    
    const getInvoiceStatus = (invoice: Invoice): Invoice['status'] => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date
        const dueDate = new Date(invoice.dueDate);
        if (invoice.status !== 'Paid' && invoice.status !== 'Partially Paid' && invoice.status !== 'Draft' && dueDate < today) {
            return 'Overdue';
        }
        return invoice.status;
    }

    const handleToggleExpenseStatus = (expense: Expense) => {
        const newStatus = expense.status === 'Paid' ? 'Unpaid' : 'Paid';
        onUpdateExpense({ ...expense, status: newStatus });
    };

    const getNextDueDate = (item: RecurringInvoice | RecurringExpense): string => {
        const lastGen = new Date(item.lastGeneratedDate);
        if (item.frequency === 'Monthly') lastGen.setMonth(lastGen.getMonth() + 1);
        else if (item.frequency === 'Quarterly') lastGen.setMonth(lastGen.getMonth() + 3);
        else if (item.frequency === 'Annually') lastGen.setFullYear(lastGen.getFullYear() + 1);
        return lastGen.toISOString().split('T')[0];
    };

    return (
    <>
        <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('finance_title')}</h1>
            <p className="mt-1 text-gray-600">{t('finance_subtitle')}</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title={t('total_revenue')} value={`$${totalRevenue.toFixed(2)}`} icon="fas fa-arrow-up" color="text-green-500" />
                <StatCard title={t('total_expenses')} value={`$${totalExpenses.toFixed(2)}`} icon="fas fa-arrow-down" color="text-red-500" />
                <StatCard title={t('net_income')} value={`$${netIncome.toFixed(2)}`} icon="fas fa-dollar-sign" color="text-blue-500" />
                <StatCard title={t('total_outstanding_invoices')} value={`$${totalOutstandingInvoices.toFixed(2)}`} icon="fas fa-file-invoice" color="text-orange-500" />
                <StatCard title={t('total_due_expenses')} value={`$${totalDueExpenses.toFixed(2)}`} icon="fas fa-money-bill-wave" color="text-yellow-500" />
                <StatCard title={t('average_payment_time')} value={averagePaymentTime !== null ? `${averagePaymentTime} ${t('days')}` : 'N/A'} icon="fas fa-hourglass-half" color="text-purple-500" />
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('invoices')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoices' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('invoices')}</button>
                        <button onClick={() => setActiveTab('expenses')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'expenses' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('expenses')}</button>
                        <button onClick={() => setActiveTab('recurring')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'recurring' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('recurring')}</button>
                        <button onClick={() => setActiveTab('budgets')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'budgets' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('budgets')}</button>
                    </nav>
                    {canManage && activeTab !== 'recurring' && (
                        <button 
                          onClick={
                              activeTab === 'invoices' ? () => handleOpenInvoiceModal() :
                              activeTab === 'expenses' ? () => handleOpenExpenseModal() :
                              () => handleOpenBudgetModal()
                          } 
                          className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 flex items-center text-sm">
                            <i className="fas fa-plus mr-2"></i>
                            {
                                activeTab === 'invoices' ? t('new_invoice') :
                                activeTab === 'expenses' ? t('new_expense') :
                                t('new_budget')
                            }
                        </button>
                    )}
                </div>

                <div className="mt-6">
                    {activeTab === 'invoices' && (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3">{t('invoice_number')}</th>
                                        <th className="px-6 py-3">{t('client_name')}</th>
                                        <th className="px-6 py-3">{t('amount')}</th>
                                        <th className="px-6 py-3">{t('due_date')}</th>
                                        <th className="px-6 py-3">{t('status')}</th>
                                        <th className="px-6 py-3">{t('receipt')}</th>
                                        {canManage && <th className="px-6 py-3 text-right">{t('actions')}</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoices.map(inv => {
                                        const finalStatus = getInvoiceStatus(inv);
                                        return (
                                            <tr key={inv.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                                                <td className="px-6 py-4">{inv.clientName}</td>
                                                <td className="px-6 py-4">
                                                    {inv.status === 'Partially Paid' ? (
                                                        <span>${(inv.paidAmount || 0).toFixed(2)} / ${inv.amount.toFixed(2)}</span>
                                                    ) : (
                                                        <span>${inv.amount.toFixed(2)}</span>
                                                    )}
                                                </td>
                                                <td className={`px-6 py-4 ${finalStatus === 'Overdue' ? 'font-bold text-red-600' : ''}`}>{inv.dueDate}</td>
                                                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[finalStatus]}`}>{t(finalStatus.replace(/\s+/g, '_').toLowerCase())}</span></td>
                                                <td className="px-6 py-4">
                                                    {inv.receipt ? (
                                                        <div className="flex items-center space-x-3">
                                                            <button onClick={() => setViewingReceipt(inv.receipt!)} className="text-gray-500 hover:text-emerald-600" title={t('view_receipt')}><i className="fas fa-eye"></i></button>
                                                            <a href={inv.receipt.dataUrl} download={inv.receipt.fileName} className="text-gray-500 hover:text-emerald-600" title={t('download_receipt')}><i className="fas fa-download"></i></a>
                                                        </div>
                                                    ) : (<span className="text-gray-400 text-xs">{t('no_receipt_attached')}</span>)}
                                                </td>
                                                {canManage && <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => handleOpenInvoiceModal(inv)} className="font-medium text-blue-600 hover:text-blue-800">{t('edit')}</button>
                                                    <button onClick={() => setDeletingId({type: 'invoice', id: inv.id})} className="font-medium text-red-600 hover:text-red-800">{t('delete')}</button>
                                                </td>}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        </div>
                    )}
                    {activeTab === 'expenses' && (
                         <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-left text-xs text-gray-700 uppercase">
                                    <tr>
                                        <th className="px-6 py-3">{t('status')}</th>
                                        <th className="px-6 py-3">{t('date')}</th>
                                        <th className="px-6 py-3">{t('description')}</th>
                                        <th className="px-6 py-3">{t('amount')}</th>
                                        <th className="px-6 py-3">{t('payable_by')}</th>
                                        <th className="px-6 py-3">{t('receipt')}</th>
                                        {canManage && <th className="px-6 py-3 text-right">{t('actions')}</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                     {expenses.map(exp => (
                                    <tr key={exp.id} className={`hover:bg-gray-50 ${exp.status === 'Paid' ? 'bg-emerald-50' : ''}`}>
                                        <td className="px-6 py-4">
                                             <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${exp.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {t(exp.status.toLowerCase())}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleExpenseStatus(exp)}
                                                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${exp.status === 'Paid' ? 'bg-emerald-600' : 'bg-gray-200'}`}
                                                    role="switch"
                                                    aria-checked={exp.status === 'Paid'}
                                                    title={`Mark as ${exp.status === 'Paid' ? t('unpaid') : t('paid')}`}
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className={`inline-block w-5 h-5 transform bg-white rounded-full shadow-lg ring-0 transition ease-in-out duration-200 ${exp.status === 'Paid' ? 'translate-x-5' : 'translate-x-0'}`}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{exp.date}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{exp.description}</td>
                                        <td className="px-6 py-4">${exp.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4">{exp.dueDate || 'N/A'}</td>
                                         <td className="px-6 py-4">
                                            {exp.receipt ? (
                                                <div className="flex items-center space-x-3">
                                                     <button onClick={() => setViewingReceipt(exp.receipt!)} className="text-gray-500 hover:text-emerald-600" title={t('view_receipt')}><i className="fas fa-eye"></i></button>
                                                    <a href={exp.receipt.dataUrl} download={exp.receipt.fileName} className="text-gray-500 hover:text-emerald-600" title={t('download_receipt')}><i className="fas fa-download"></i></a>
                                                </div>
                                            ) : (<span className="text-gray-400 text-xs">{t('no_receipt_attached')}</span>)}
                                        </td>
                                        {canManage && <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => handleOpenExpenseModal(exp)} className="font-medium text-blue-600 hover:text-blue-800">{t('edit')}</button>
                                            <button onClick={() => setDeletingId({type: 'expense', id: exp.id})} className="font-medium text-red-600 hover:text-red-800">{t('delete')}</button>
                                        </td>}
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </div>
                    )}
                    {activeTab === 'recurring' && (
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <div className="p-1 bg-gray-200 rounded-lg">
                                    <button onClick={() => setActiveRecurringTab('invoices')} className={`px-3 py-1 text-sm font-semibold rounded-md ${activeRecurringTab === 'invoices' ? 'bg-white shadow' : 'text-gray-600'}`}>{t('recurring_invoices')}</button>
                                    <button onClick={() => setActiveRecurringTab('expenses')} className={`px-3 py-1 text-sm font-semibold rounded-md ${activeRecurringTab === 'expenses' ? 'bg-white shadow' : 'text-gray-600'}`}>{t('recurring_expenses')}</button>
                                </div>
                                {canManage && (
                                    <button onClick={activeRecurringTab === 'invoices' ? () => handleOpenInvoiceModal() : () => handleOpenExpenseModal()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center text-sm">
                                        <i className="fas fa-plus mr-2"></i>
                                        {activeRecurringTab === 'invoices' ? t('new_recurring_invoice') : t('new_recurring_expense')}
                                    </button>
                                )}
                            </div>
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                {activeRecurringTab === 'invoices' && (
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-left text-xs text-gray-700 uppercase">
                                            <tr>
                                                <th className="px-6 py-3">{t('client_name')}</th><th className="px-6 py-3">{t('amount')}</th>
                                                <th className="px-6 py-3">{t('frequency')}</th><th className="px-6 py-3">{t('next_due_date')}</th>
                                                {canManage && <th className="px-6 py-3 text-right">{t('actions')}</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {recurringInvoices.map(ri => (
                                                <tr key={ri.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium">{ri.clientName}</td><td className="px-6 py-4">${ri.amount.toFixed(2)}</td>
                                                    <td className="px-6 py-4">{t(ri.frequency.toLowerCase())}</td><td className="px-6 py-4">{getNextDueDate(ri)}</td>
                                                    {canManage && <td className="px-6 py-4 text-right"><button onClick={() => setDeletingId({type: 'recurringInvoice', id: ri.id})} className="font-medium text-red-600 hover:text-red-800">{t('delete')}</button></td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                                {activeRecurringTab === 'expenses' && (
                                     <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-left text-xs text-gray-700 uppercase">
                                            <tr>
                                                <th className="px-6 py-3">{t('description')}</th><th className="px-6 py-3">{t('amount')}</th>
                                                <th className="px-6 py-3">{t('frequency')}</th><th className="px-6 py-3">{t('next_due_date')}</th>
                                                {canManage && <th className="px-6 py-3 text-right">{t('actions')}</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {recurringExpenses.map(re => (
                                                <tr key={re.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium">{re.description}</td><td className="px-6 py-4">${re.amount.toFixed(2)}</td>
                                                    <td className="px-6 py-4">{t(re.frequency.toLowerCase())}</td><td className="px-6 py-4">{getNextDueDate(re)}</td>
                                                    {canManage && <td className="px-6 py-4 text-right"><button onClick={() => setDeletingId({type: 'recurringExpense', id: re.id})} className="font-medium text-red-600 hover:text-red-800">{t('delete')}</button></td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                     {activeTab === 'budgets' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {budgetsWithSpent.map(budget => {
                                const spent = budget.spentAmount;
                                const remaining = budget.amount - spent;
                                const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                                const project = budget.projectId ? projects.find(p => p.id === budget.projectId) : null;
                                return (
                                <div key={budget.id} className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg text-gray-800">{budget.title}</h3>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${budget.type === 'Project' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {t(budget.type === 'Project' ? 'project_budget' : 'office_management')}
                                            </span>
                                        </div>
                                        {project && <p className="text-xs text-gray-500 mt-1">Project: {project.title}</p>}
                                        <p className="text-sm text-gray-500 mt-2">{budget.startDate} to {budget.endDate}</p>

                                        <div className="mt-4">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">{t('amount_spent')}</span>
                                                <span className="font-semibold">${spent.toFixed(2)}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-4">
                                                <div 
                                                    className={`h-4 rounded-full ${progress > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                ></div>
                                            </div>
                                             <div className="flex justify-between text-sm mt-1">
                                                <span className="text-gray-600">{t('remaining')}: <span className={remaining < 0 ? 'text-red-600 font-bold' : 'text-green-600'}>${remaining.toFixed(2)}</span></span>
                                                <span className="font-bold text-gray-800">${budget.amount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 border-t pt-3 flex justify-end space-x-4">
                                        <button onClick={() => handleOpenBudgetDetailModal(budget)} className="text-sm font-semibold text-emerald-600 hover:text-emerald-800">{t('view_details')}</button>
                                        {canManage && <>
                                            <button onClick={() => handleOpenBudgetModal(budget)} className="text-sm font-medium text-blue-600 hover:text-blue-800">{t('edit')}</button>
                                            <button onClick={() => setDeletingId({type: 'budget', id: budget.id})} className="text-sm font-medium text-red-600 hover:text-red-800">{t('delete')}</button>
                                        </>}
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
        
        {isInvoiceModalOpen && <InvoiceFormModal invoice={editingInvoice} onClose={() => setInvoiceModalOpen(false)} onSave={handleSaveInvoice} onSaveRecurring={handleSaveRecurringInvoice} />}
        {isExpenseModalOpen && <ExpenseFormModal expense={editingExpense} budgets={budgets} onClose={() => setExpenseModalOpen(false)} onSave={handleSaveExpense} onSaveRecurring={handleSaveRecurringExpense} />}
        {isBudgetModalOpen && <BudgetFormModal budget={editingBudget} projects={projects} onClose={() => setBudgetModalOpen(false)} onSave={handleSaveBudget} />}
        {isBudgetDetailModalOpen && viewingBudget && <BudgetDetailModal budget={viewingBudget} expenses={expenses} onClose={() => setBudgetDetailModalOpen(false)} onUpdateBudget={onUpdateBudget} />}
        {deletingId && <ConfirmationModal title={t('confirm_delete')} message={t('confirm_delete_message')} onConfirm={confirmDelete} onCancel={() => setDeletingId(null)} />}
        {viewingReceipt && <ReceiptViewerModal receipt={viewingReceipt} onClose={() => setViewingReceipt(null)} />}
    </>
    );
};

export default Finance;