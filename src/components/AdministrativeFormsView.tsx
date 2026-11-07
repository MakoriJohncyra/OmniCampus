import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Paperclip, 
  ShieldCheck, 
  MessageSquare,
  X,
  FileCheck2
} from 'lucide-react';
import { AdministrativeForm, FormStatus, FormType, UserProfile } from '../types';
import { getRolePermissions } from '../utils/timetableConflict';

interface AdministrativeFormsViewProps {
  currentUser: UserProfile;
  forms: AdministrativeForm[];
  onSubmitForm: (newForm: AdministrativeForm) => void;
  onUpdateFormStatus: (formId: string, status: FormStatus, remarks: string) => void;
}

export const AdministrativeFormsView: React.FC<AdministrativeFormsViewProps> = ({
  currentUser,
  forms,
  onSubmitForm,
  onUpdateFormStatus
}) => {
  const perms = getRolePermissions(currentUser.role);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reviewingForm, setReviewingForm] = useState<AdministrativeForm | null>(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Submit form state
  const [formType, setFormType] = useState<FormType>('clearance');
  const [formTitle, setFormTitle] = useState('');
  const [formReason, setFormReason] = useState('');
  const [customField1, setCustomField1] = useState('');
  const [customField2, setCustomField2] = useState('');

  const filteredForms = forms.filter(f => {
    const roleMatch = perms.canApproveForms ? true : f.applicantId === currentUser.id;
    const statusMatch = selectedStatusFilter === 'all' || f.status === selectedStatusFilter;
    return roleMatch && statusMatch;
  });

  /**
   * UI Color Rule:
   * Pending/Submitted: Soft Yellow/Amber (#FEF3C7)
   * Approved: Soft Green (#DCFCE7)
   * Clear workflow status indicators.
   */
  const getStatusBadge = (status: FormStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#15803d] bg-[#DCFCE7] border border-green-300 px-3 py-1 rounded-full shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#b91c1c] bg-[#FEE2E2] border border-red-300 px-3 py-1 rounded-full shadow-xs">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Rejected
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] border border-amber-300 px-3 py-1 rounded-full shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> Under Review
          </span>
        );
      case 'submitted':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] border border-amber-300 px-3 py-1 rounded-full shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> Pending Approval
          </span>
        );
    }
  };

  const handleOpenReview = (form: AdministrativeForm) => {
    setReviewingForm(form);
    setReviewRemarks(form.reviewerRemarks || '');
  };

  const handleReviewAction = (status: 'approved' | 'rejected') => {
    if (!reviewingForm) return;
    onUpdateFormStatus(
      reviewingForm.id, 
      status, 
      reviewRemarks.trim() || (status === 'approved' ? 'Form requirements verified and approved by Registry.' : 'Documentation insufficient.')
    );
    setReviewingForm(null);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReason.trim()) return;

    const generatedRef = `FORM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newForm: AdministrativeForm = {
      id: `form-${Date.now()}`,
      referenceNumber: generatedRef,
      formType,
      title: formTitle || `${formType.replace(/_/g, ' ').toUpperCase()} Application`,
      applicantId: currentUser.id,
      applicantName: currentUser.fullName,
      applicantIdNumber: currentUser.idNumber,
      applicantDepartment: currentUser.department,
      reason: formReason.trim(),
      status: 'submitted',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      details: {
        field_1: customField1 || 'Standard Request',
        field_2: customField2 || 'N/A'
      },
      attachments: ['supporting_document.pdf']
    };

    onSubmitForm(newForm);
    setShowSubmitModal(false);
    setFormReason('');
    setFormTitle('');
    setCustomField1('');
    setCustomField2('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-amber-50 text-[#F59E0B] rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">Administrative Forms Portal</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Submit, track, and adjudicate official campus clearances, leaves of absence, grade re-evaluations, and degree certificates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 bg-[#312E81] hover:bg-indigo-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Submit New Form</span>
          </button>
        </div>
      </div>

      {/* Admin Notice */}
      {perms.canApproveForms && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 flex items-center justify-between text-[#312E81] text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#312E81] shrink-0" />
            <span>
              <strong className="text-indigo-950">Administrative Staff Authority:</strong> You hold review authority to sign off or reject pending campus applications.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold bg-[#312E81] text-white px-2.5 py-1 rounded-lg">Adjudication Mode</span>
        </div>
      )}

      {/* Filter by status */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-500 font-bold shrink-0 uppercase tracking-wider text-[11px]">Filter Status:</span>
        {[
          { id: 'all', label: 'All Submissions' },
          { id: 'submitted', label: 'Pending Approval' },
          { id: 'under_review', label: 'Under Review' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' }
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStatusFilter(s.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              selectedStatusFilter === s.id
                ? 'bg-[#312E81] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredForms.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-base font-bold text-slate-800">No administrative forms found</p>
            <p className="text-xs text-slate-500 mt-1">Submit a clearance or appeal application to start tracking.</p>
          </div>
        ) : (
          filteredForms.map((form) => (
            <div 
              key={form.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-extrabold bg-[#312E81] text-white px-2.5 py-1 rounded-lg shadow-xs">
                    {form.referenceNumber}
                  </span>
                  <span className="text-xs uppercase tracking-wider font-extrabold text-slate-500">
                    {form.formType.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(form.status)}
                  <span className="text-[11px] text-slate-400 font-mono font-medium">
                    {form.submittedAt}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-[#111827]">{form.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{form.reason}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-2 font-medium">
                  <span>Applicant: <strong className="text-slate-800">{form.applicantName}</strong> ({form.applicantIdNumber})</span>
                  <span>Dept: <strong className="text-slate-700">{form.applicantDepartment}</strong></span>
                  {form.attachments && form.attachments.length > 0 && (
                    <span className="flex items-center gap-1 text-[#312E81] font-mono font-semibold">
                      <Paperclip className="w-3.5 h-3.5" /> {form.attachments.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Reviewer comments if present */}
              {form.reviewerRemarks && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#312E81]" /> Registry Decision Remarks:
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">{form.reviewerName}</span>
                  </div>
                  <p className="text-slate-700 italic mt-0.5">{form.reviewerRemarks}</p>
                </div>
              )}

              {/* Action Buttons for Admins */}
              {perms.canApproveForms && (
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenReview(form)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#312E81] hover:bg-indigo-900 text-white text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    <span>Adjudicate / Review Form</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review Modal for Admin Staff */}
      {reviewingForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#F59E0B]">Registry Board Adjudication</span>
                <h3 className="text-lg font-extrabold text-[#111827] mt-0.5">Review: {reviewingForm.referenceNumber}</h3>
              </div>
              <button onClick={() => setReviewingForm(null)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <p className="text-[#111827] font-bold">{reviewingForm.title}</p>
              <p className="text-slate-600">Applicant: {reviewingForm.applicantName} ({reviewingForm.applicantIdNumber})</p>
              <p className="text-slate-700 mt-1">{reviewingForm.reason}</p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-700 font-bold">Reviewer Remarks / Justification *</label>
              <textarea
                rows={3}
                placeholder="Enter feedback, clearance stipulations, or approval notes..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
              ></textarea>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewingForm(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReviewAction('rejected')}
                  className="px-4 py-2 text-xs font-bold text-red-900 bg-[#FEE2E2] hover:bg-red-200 border border-red-300 rounded-xl shadow-xs transition"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => handleReviewAction('approved')}
                  className="px-4 py-2 text-xs font-bold text-emerald-950 bg-[#DCFCE7] hover:bg-green-200 border border-green-300 rounded-xl shadow-xs transition"
                >
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Form Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#312E81]">Digital Registry Gateway</span>
                <h3 className="text-lg font-extrabold text-[#111827] mt-0.5">Submit Official Administrative Form</h3>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Form Classification *</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as FormType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                >
                  <option value="clearance">Graduation & Institutional Clearance</option>
                  <option value="leave_of_absence">Medical / Compassionate Leave of Absence</option>
                  <option value="grade_appeal">Academic Grade Re-Evaluation Appeal</option>
                  <option value="transcript_request">Official Academic Transcript Request</option>
                  <option value="course_add_drop">Late Course Add / Drop Petition</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Application Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leave of Absence Request for Medical Reasons"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Detailed Reason & Statement *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State your reasons, course codes involved, or relevant circumstances..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Term / Academic Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025/2026 Semester 1"
                    value={customField1}
                    onChange={(e) => setCustomField1(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Emergency / Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={customField2}
                    onChange={(e) => setCustomField2(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Paperclip className="w-3.5 h-3.5 text-[#312E81]" />
                  Supporting Attachment: <strong className="text-slate-900">supporting_document.pdf</strong>
                </span>
                <span className="text-emerald-700 font-bold bg-[#DCFCE7] px-2 py-0.5 rounded border border-green-200">Attached</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#312E81] hover:bg-indigo-900 rounded-xl shadow-xs transition"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
