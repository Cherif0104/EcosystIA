
import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { LeaveRequest } from '../types';

const statusStyles = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
};

const LeaveRequestModal: React.FC<{
    onClose: () => void;
    onSave: (request: Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'userAvatar' | 'status'>) => void;
}> = ({ onClose, onSave }) => {
    const { t } = useLocalization();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !reason) return;
        onSave({ startDate, endDate, reason });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold">{t('request_leave')}</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('start_date')}</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('end_date')}</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full p-2 border rounded-md" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('reason')}</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} className="mt-1 block w-full p-2 border rounded-md" required />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">{t('cancel')}</button>
                        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700">{t('submit_request')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface LeaveManagementProps {
    leaveRequests: LeaveRequest[];
    onAddLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'userAvatar' | 'status'>) => void;
    onUpdateLeaveRequestStatus: (id: number, status: 'Approved' | 'Rejected') => void;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ leaveRequests, onAddLeaveRequest, onUpdateLeaveRequestStatus }) => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const [isModalOpen, setModalOpen] = useState(false);

    if (!user) return null;

    const myRequests = leaveRequests.filter(req => req.userId === user.id);
    const teamRequests = leaveRequests.filter(req => req.status === 'Pending'); // Simplified for demo
    const canManage = user.role === 'administrator' || user.role === 'manager' || user.role === 'supervisor';
    
    return (
        <>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{t('leave_management')}</h1>
                    <p className="mt-1 text-gray-600">{t('leave_management_subtitle')}</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 flex items-center">
                    <i className="fas fa-plus mr-2"></i>
                    {t('request_leave')}
                </button>
            </div>

            {canManage && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-700 mb-4">{t('team_requests')}</h2>
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('start_date')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('end_date')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('reason')}</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {teamRequests.length > 0 ? teamRequests.map(req => (
                                        <tr key={req.id}>
                                            <td className="px-6 py-4 whitespace-nowrap flex items-center"><img src={req.userAvatar} className="w-8 h-8 rounded-full mr-3"/>{req.userName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{req.startDate}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{req.endDate}</td>
                                            <td className="px-6 py-4">{req.reason}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                <button onClick={() => onUpdateLeaveRequestStatus(req.id, 'Approved')} className="text-green-600 hover:text-green-900">{t('approve')}</button>
                                                <button onClick={() => onUpdateLeaveRequestStatus(req.id, 'Rejected')} className="text-red-600 hover:text-red-900">{t('reject')}</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="text-center py-8 text-gray-500">{t('no_leave_requests')}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">{t('my_requests')}</h2>
                 <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                         <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('start_date')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('end_date')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('reason')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-gray-200">
                                 {myRequests.length > 0 ? myRequests.map(req => (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{req.startDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{req.endDate}</td>
                                        <td className="px-6 py-4">{req.reason}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[req.status]}`}>{t(req.status.toLowerCase())}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="text-center py-8 text-gray-500">{t('no_leave_requests')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <LeaveRequestModal
                    onClose={() => setModalOpen(false)}
                    onSave={onAddLeaveRequest}
                />
            )}
        </>
    );
};

export default LeaveManagement;
