import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  CheckCircle2, 
  MapPin, 
  X,
  BookCheck
} from 'lucide-react';
import { LibraryBook, BookLoan, UserProfile } from '../types';

interface LibraryCatalogViewProps {
  currentUser: UserProfile;
  books: LibraryBook[];
  loans: BookLoan[];
  onBorrowBook: (bookId: string, durationDays: number) => void;
  onReturnBook: (loanId: string) => void;
}

export const LibraryCatalogView: React.FC<LibraryCatalogViewProps> = ({
  currentUser,
  books,
  loans,
  onBorrowBook,
  onReturnBook
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_loans'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [borrowModalBook, setBorrowModalBook] = useState<LibraryBook | null>(null);
  const [borrowDurationDays, setBorrowDurationDays] = useState(14);
  const [borrowSuccessMessage, setBorrowSuccessMessage] = useState<string | null>(null);

  const filteredBooks = books.filter((b) => {
    const matchesSearch = 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.authors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFormat = selectedFormat === 'all' || b.format === selectedFormat;
    const matchesAvail = 
      selectedAvailability === 'all' || 
      (selectedAvailability === 'available' && b.availableCopies > 0) ||
      (selectedAvailability === 'checked_out' && b.availableCopies === 0);
    return matchesSearch && matchesFormat && matchesAvail;
  });

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowModalBook) return;

    onBorrowBook(borrowModalBook.id, borrowDurationDays);
    setBorrowSuccessMessage(`Successfully checked out "${borrowModalBook.title}". Due in ${borrowDurationDays} days.`);
    setBorrowModalBook(null);
    setTimeout(() => setBorrowSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-emerald-50 text-[#10B981] rounded-xl">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight">University Library Catalog</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Search physical collection stacks across campus libraries and read digital e-books with integrated borrowing workflows.
          </p>
        </div>

        {/* Catalog vs Active Loans switcher */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'catalog' ? 'bg-[#312E81] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stack Catalog ({books.length})
          </button>
          <button
            onClick={() => setActiveTab('my_loans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'my_loans' ? 'bg-[#312E81] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>My Active Loans</span>
            {loans.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-400 text-[#1e1b4b] rounded-full text-[10px] font-extrabold">
                {loans.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {borrowSuccessMessage && (
        <div className="bg-[#DCFCE7] border-2 border-[#10B981] rounded-2xl p-4 flex items-center gap-3 text-emerald-950 text-xs shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <p className="font-bold">{borrowSuccessMessage}</p>
        </div>
      )}

      {activeTab === 'catalog' ? (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, author, or ISBN (e.g. 978-0134494166)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:bg-white"
              />
            </div>

            <div className="w-full md:w-48">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
              >
                <option value="all">All Formats</option>
                <option value="physical">Physical Stack Books</option>
                <option value="digital_pdf">Digital PDF E-Books</option>
                <option value="digital_epub">Digital ePub</option>
              </select>
            </div>

            <div className="w-full md:w-48">
              <select
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
              >
                <option value="all">All Availability</option>
                <option value="available">Available Copies Only</option>
                <option value="checked_out">Checked Out / Reserved</option>
              </select>
            </div>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => {
              const isAvailable = book.availableCopies > 0;
              const isDigital = book.format.startsWith('digital');

              return (
                <div 
                  key={book.id}
                  className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs transition group"
                >
                  <div>
                    {/* Cover & Badges */}
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img 
                        src={book.coverImageUrl} 
                        alt={book.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                      
                      {/* UI Color Rule: Available (Soft Green #DCFCE7), Booked (Soft Red #FEE2E2) */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${
                          isAvailable 
                            ? 'bg-[#DCFCE7] text-[#15803d] border border-green-300' 
                            : 'bg-[#FEE2E2] text-[#b91c1c] border border-red-300'
                        }`}>
                          {isAvailable ? `${book.availableCopies} Available` : 'Checked Out'}
                        </span>
                        {isDigital && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 shadow-xs">
                            Digital E-Book
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white font-mono font-medium drop-shadow-sm">
                        <span>{book.callNumber}</span>
                        <span>Pub. {book.publicationYear}</span>
                      </div>
                    </div>

                    {/* Book Details */}
                    <div className="p-4 sm:p-5 space-y-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-[#111827] group-hover:text-[#312E81] transition line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold">
                        By {book.authors.join(', ')}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {book.summary}
                      </p>

                      <div className="pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          <span className="truncate">{book.shelfLocation}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 font-medium">
                          <span>ISBN: <strong className="text-slate-800">{book.isbn}</strong></span>
                          <span>Copies: {book.availableCopies}/{book.totalCopies}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="p-4 sm:p-5 pt-0">
                    {isAvailable ? (
                      <button
                        onClick={() => setBorrowModalBook(book)}
                        className="w-full flex items-center justify-center gap-2 bg-[#312E81] hover:bg-indigo-900 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-xs"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-amber-300" />
                        <span>Request Borrow / Reserve</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-slate-100 text-slate-400 cursor-not-allowed font-bold py-2.5 rounded-xl text-xs border border-slate-200"
                      >
                        Currently Checked Out
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* My Active Loans View */
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-extrabold text-[#111827] mb-1">Active Loans & Due Dates</h3>
            <p className="text-xs text-slate-500">
              Students and staff may keep books for up to 14–28 days. Up to 2 online renewals permitted before physical return.
            </p>
          </div>

          {loans.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <BookCheck className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-base font-bold text-slate-800">No active book loans</p>
              <p className="text-xs text-slate-500 mt-1">Browse the library stack catalog to borrow physical or digital volumes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => (
                <div 
                  key={loan.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="p-3 bg-emerald-50 text-[#10B981] rounded-xl shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#111827]">{loan.bookTitle}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Borrowed: <span className="text-slate-800 font-medium">{loan.borrowedAt}</span> &bull; Due date:{' '}
                        <span className="text-emerald-700 font-extrabold bg-[#DCFCE7] px-2 py-0.5 rounded border border-green-200">{loan.dueDate}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Status: <span className="capitalize text-slate-800 font-bold">{loan.status}</span> &bull; Renewals used:{' '}
                        {loan.renewalsCount}/2
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => onReturnBook(loan.id)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition"
                    >
                      Return Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Borrow Modal */}
      {borrowModalBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[#10B981]">Library Circulation Desk</span>
                <h3 className="text-lg font-extrabold text-[#111827] mt-0.5">Borrow Confirmation</h3>
              </div>
              <button onClick={() => setBorrowModalBook(null)} className="text-slate-400 hover:text-slate-800 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <p className="font-extrabold text-[#111827] text-sm">{borrowModalBook.title}</p>
              <p className="text-slate-600">Call No: {borrowModalBook.callNumber} &bull; Location: {borrowModalBook.shelfLocation}</p>
              <p className="text-emerald-700 font-bold">Available Copies: {borrowModalBook.availableCopies} remaining</p>
            </div>

            <form onSubmit={handleBorrowSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Borrow Duration</label>
                <select
                  value={borrowDurationDays}
                  onChange={(e) => setBorrowDurationDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                >
                  <option value={14}>14 Days (Standard Student Loan)</option>
                  <option value={21}>21 Days (Honours / Final Year Project)</option>
                  <option value={28}>28 Days (Faculty / Research Loan)</option>
                </select>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                <p>Borrower: <strong className="text-slate-900">{currentUser.fullName} ({currentUser.idNumber})</strong></p>
                <p className="mt-0.5">Automated return notices will be sent to <code className="text-[#312E81] font-semibold">{currentUser.email}</code>.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBorrowModalBook(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] rounded-xl shadow-xs transition"
                >
                  Confirm Borrow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
