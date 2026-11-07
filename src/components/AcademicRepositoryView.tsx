import React, { useState } from 'react';
import { 
  FolderDown, 
  Search, 
  Filter, 
  UploadCloud, 
  FileText, 
  Download, 
  CheckCircle2, 
  ShieldAlert, 
  X,
  FileCheck,
  Eye
} from 'lucide-react';
import { AcademicResource, UserProfile, ResourceCategory } from '../types';
import { getRolePermissions } from '../utils/timetableConflict';

interface AcademicRepositoryViewProps {
  currentUser: UserProfile;
  resources: AcademicResource[];
  onUploadResource: (newRes: AcademicResource) => void;
  onDownloadResource: (res: AcademicResource) => void;
}

export const AcademicRepositoryView: React.FC<AcademicRepositoryViewProps> = ({
  currentUser,
  resources,
  onUploadResource,
  onDownloadResource
}) => {
  const perms = getRolePermissions(currentUser.role);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  const [activePreview, setActivePreview] = useState<AcademicResource | null>(null);

  // Upload Form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCourseCode, setUploadCourseCode] = useState('CS301');
  const [uploadCourseName, setUploadCourseName] = useState('Distributed Systems Architecture');
  const [uploadCategory, setUploadCategory] = useState<ResourceCategory>('lecture_notes');
  const [uploadFileType, setUploadFileType] = useState<'pdf' | 'docx' | 'pptx' | 'zip' | 'ipynb'>('pdf');
  const [uploadYear, setUploadYear] = useState('2025/2026');
  const [uploadSemester, setUploadSemester] = useState<'Semester 1' | 'Semester 2'>('Semester 1');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  const departments = Array.from(new Set(resources.map(r => r.department)));

  const filteredResources = resources.filter(res => {
    const matchesSearch = 
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || res.category === selectedCategory;
    const matchesDept = selectedDepartment === 'all' || res.department === selectedDepartment;
    const matchesSemester = selectedSemester === 'all' || res.semester === selectedSemester;
    return matchesSearch && matchesCategory && matchesDept && matchesSemester;
  });

  const handleUploadClick = () => {
    if (!perms.canUploadResources) {
      setShowPermissionAlert(true);
    } else {
      setShowUploadModal(true);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    const newResource: AcademicResource = {
      id: `res-${Date.now()}`,
      title: uploadTitle.trim(),
      courseCode: uploadCourseCode.trim().toUpperCase(),
      courseName: uploadCourseName.trim(),
      department: currentUser.department,
      category: uploadCategory,
      fileType: uploadFileType,
      fileSizeBytes: Math.floor(Math.random() * 5000000) + 1000000,
      academicYear: uploadYear,
      semester: uploadSemester,
      downloadCount: 0,
      uploadedBy: currentUser.fullName,
      uploadedAt: new Date().toISOString().split('T')[0],
      isVerified: currentUser.role === 'system_admin' || currentUser.role === 'admin_staff',
      downloadUrl: '#',
      description: uploadDescription || 'Official course material provided by faculty instructor.'
    };

    onUploadResource(newResource);
    setShowUploadModal(false);
    setUploadTitle('');
    setSelectedFileName('');
    setUploadDescription('');
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-indigo-50 text-[#312E81] rounded-xl">
              <FolderDown className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">Academic Resource Repository</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Centralized depository for institutional lecture notes, past examination papers, syllabus documents, and laboratory manuals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 bg-[#312E81] hover:bg-indigo-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-amber-300" />
            <span>Upload Course Material</span>
          </button>
        </div>
      </div>

      {/* Permission Warning Dialog for Students */}
      {showPermissionAlert && (
        <div className="bg-[#FEF3C7] border-2 border-[#F59E0B] rounded-2xl p-4 flex items-start justify-between gap-3 text-amber-950 shadow-xs">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-extrabold text-amber-900 text-sm">RBAC Scope: Lecturer or Admin Role Required</p>
              <p className="text-amber-800 mt-0.5">
                Current persona is <strong className="text-amber-950">{currentUser.fullName} ({currentUser.role})</strong>. 
                Under university compliance rules, only Lecturers, Course Coordinators, or Administrative Staff can publish official course materials and exam papers. 
                Use the top-right persona switcher to switch to <strong>Dr. Elena Rostova (Lecturer)</strong>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowPermissionAlert(false)} 
            className="text-amber-800 hover:text-amber-950 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, course code (e.g. CS301), or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
            >
              <option value="all">All Semesters</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
              <option value="Summer Term">Summer Term</option>
            </select>
          </div>
        </div>

        {/* Category Pill Filters with Sunset Amber & Indigo accents */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar text-xs">
          <span className="text-slate-500 font-bold shrink-0 uppercase tracking-wider text-[11px]">Category:</span>
          {[
            { id: 'all', label: 'All Files' },
            { id: 'lecture_notes', label: '📖 Lecture Notes' },
            { id: 'past_exam_paper', label: '📝 Past Exam Papers' },
            { id: 'lab_manual', label: '🧪 Lab Manuals' },
            { id: 'syllabus', label: '📋 Syllabus & Guides' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-[#312E81] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-3.5">
        {filteredResources.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <p className="text-base font-bold text-slate-800">No resources found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or category filter.</p>
          </div>
        ) : (
          filteredResources.map((res) => {
            const isExam = res.category === 'past_exam_paper';
            return (
              <div 
                key={res.id}
                className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    isExam 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-indigo-100 text-[#312E81] border border-indigo-200'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-[#312E81] text-white shadow-xs">
                        {res.courseCode}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                        isExam ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                      }`}>
                        {isExam ? 'Past Examination' : res.category.replace('_', ' ')}
                      </span>
                      {res.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-[#DCFCE7] px-2 py-0.5 rounded-lg border border-green-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Syllabus
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#111827] hover:text-[#312E81] transition cursor-pointer" onClick={() => setActivePreview(res)}>
                      {res.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {res.courseName} &bull; <span className="text-slate-700 font-medium">{res.department}</span>
                    </p>
                    {res.description && (
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{res.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                      <span>Term: {res.semester} ({res.academicYear})</span>
                      <span>Format: <strong className="uppercase text-slate-800">{res.fileType}</strong> ({(res.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)</span>
                      <span>Uploaded by: <strong className="text-slate-700">{res.uploadedBy}</strong></span>
                      <span>Downloads: <strong className="text-slate-800">{res.downloadCount}</strong></span>
                    </div>
                  </div>
                </div>

                {/* UI Color Rule: Solid Emerald/Green (#10B981) Download Button */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setActivePreview(res)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition text-xs"
                    title="View metadata and overview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownloadResource(res)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold shadow-xs transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Material</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview Modal */}
      {activePreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-extrabold text-[#312E81] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {activePreview.courseCode}
                </span>
                <h3 className="text-lg font-extrabold text-[#111827] mt-2">{activePreview.title}</h3>
              </div>
              <button onClick={() => setActivePreview(null)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="text-slate-900 font-bold">{activePreview.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Academic Year:</span>
                <span className="text-slate-900">{activePreview.academicYear} &bull; {activePreview.semester}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">File Specifications:</span>
                <span className="text-slate-900 uppercase font-bold">{activePreview.fileType} ({(activePreview.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Total Downloads:</span>
                <span className="text-emerald-700 font-extrabold">{activePreview.downloadCount} verified campus retrievals</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {activePreview.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActivePreview(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onDownloadResource(activePreview);
                  setActivePreview(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] rounded-xl shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Confirm Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Material Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#312E81]">Lecturer & Admin Portal</span>
                <h3 className="text-lg font-extrabold text-[#111827] mt-0.5">Publish Academic Course Material</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Material Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS301 Lecture 08: Distributed Paxos Consensus"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    value={uploadCourseCode}
                    onChange={(e) => setUploadCourseCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={uploadCourseName}
                    onChange={(e) => setUploadCourseName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category *</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as ResourceCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  >
                    <option value="lecture_notes">Lecture Notes</option>
                    <option value="past_exam_paper">Past Examination Paper</option>
                    <option value="lab_manual">Lab Manual</option>
                    <option value="syllabus">Course Syllabus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Format *</label>
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="docx">Word Document (.docx)</option>
                    <option value="pptx">PowerPoint Slides (.pptx)</option>
                    <option value="ipynb">Jupyter Notebook (.ipynb)</option>
                    <option value="zip">Archive Archive (.zip)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={uploadYear}
                    onChange={(e) => setUploadYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Semester</label>
                  <select
                    value={uploadSemester}
                    onChange={(e) => setUploadSemester(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description / Syllabus Scope</label>
                <textarea
                  rows={2}
                  placeholder="Summarize the topics, lecture numbers, or exam format..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
                ></textarea>
              </div>

              <div className="border-2 border-dashed border-slate-300 hover:border-[#312E81] rounded-2xl p-5 text-center cursor-pointer transition bg-slate-50">
                <UploadCloud className="w-8 h-8 mx-auto text-[#312E81] mb-2" />
                <p className="text-slate-800 font-bold">Click to select file or drag & drop</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Maximum file size: 50MB (PDF, DOCX, PPTX, IPYNB, ZIP)</p>
                <input 
                  type="file" 
                  className="hidden" 
                  id="file-input"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFileName(e.target.files[0].name);
                      if (!uploadTitle) {
                        setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                      }
                    }
                  }}
                />
                <label htmlFor="file-input" className="mt-2.5 inline-block px-3.5 py-1.5 bg-[#312E81] hover:bg-indigo-900 text-white rounded-lg text-xs font-bold cursor-pointer transition">
                  Browse Files
                </label>
                {selectedFileName && (
                  <p className="text-emerald-700 font-bold mt-2 flex items-center justify-center gap-1">
                    <FileCheck className="w-4 h-4 text-emerald-600" /> Selected: {selectedFileName}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#312E81] hover:bg-indigo-900 rounded-xl shadow-xs transition"
                >
                  Publish to Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
