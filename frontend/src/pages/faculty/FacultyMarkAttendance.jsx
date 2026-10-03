import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { facultyAPI } from '../../api/faculty';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { CheckCircle, XCircle, Clock, AlertCircle, Send, Users } from 'lucide-react';

const STATUS_OPTS = [
  { value: 'present', label: 'Present', icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50  border-green-300' },
  { value: 'absent',  label: 'Absent',  icon: XCircle,     color: 'text-red-600',    bg: 'bg-red-50    border-red-300' },
  { value: 'late',    label: 'Late',    icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300' },
  { value: 'excused', label: 'Excused', icon: AlertCircle,  color: 'text-blue-600',   bg: 'bg-blue-50   border-blue-300' },
];

export default function FacultyMarkAttendance() {
  const qc = useQueryClient();

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [date,         setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [periodNumber, setPeriodNumber] = useState(1);
  const [startTime,    setStartTime]    = useState('09:00');
  const [endTime,      setEndTime]      = useState('09:50');
  const [topic,        setTopic]        = useState('');
  const [records,      setRecords]      = useState({});
  const [step,         setStep]         = useState(1); // 1=setup, 2=mark

  const assignQ = useQuery({ queryKey: ['faculty-assignments'], queryFn: () => facultyAPI.getAssignments() });
  const studentsQ = useQuery({
    queryKey: ['section-students', selectedAssignment?.section?._id],
    queryFn: () => facultyAPI.getSectionStudents(selectedAssignment.section._id),
    enabled: !!selectedAssignment?.section?._id && step === 2,
    onSuccess: (res) => {
      const init = {};
      (res?.data || []).forEach(s => { init[s._id] = 'present'; });
      setRecords(init);
    },
  });

  const markMutation = useMutation({
    mutationFn: (d) => facultyAPI.markAttendance(d),
    onSuccess: () => {
      toast.success('Attendance marked successfully!');
      qc.invalidateQueries(['faculty-records-recent']);
      setStep(1);
      setSelectedAssignment(null);
      setRecords({});
      setTopic('');
    },
    onError: (e) => toast.error(e.message || 'Failed to mark attendance'),
  });

  const students = studentsQ.data?.data || [];

  const setAll = (status) => {
    const upd = {};
    students.forEach(s => { upd[s._id] = status; });
    setRecords(upd);
  };

  const handleSubmit = () => {
    if (!selectedAssignment) return;
    const payload = {
      subject:         selectedAssignment.subject._id,
      section:         selectedAssignment.section._id,
      academicSession: selectedAssignment.academicSession._id,
      date, periodNumber: parseInt(periodNumber), startTime, endTime, topic,
      lectureType: selectedAssignment.subject?.type === 'lab' ? 'practical' : 'lecture',
      records: students.map(s => ({ student: s._id, status: records[s._id] || 'absent' })),
    };
    markMutation.mutate(payload);
  };

  const presentCount = Object.values(records).filter(v => v === 'present').length;
  const lateCount    = Object.values(records).filter(v => v === 'late').length;

  if (assignQ.isLoading) return <PageLoader />;
  if (assignQ.error) return <ErrorAlert message={assignQ.error.message} onRetry={assignQ.refetch} />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle">Select a subject and mark students present or absent</p>
      </div>

      {/* Step 1 – Setup */}
      {step === 1 && (
        <div className="card p-6 space-y-5">
          <h2 className="section-title">Lecture Setup</h2>

          {/* Assignment selector */}
          <div>
            <label className="label">Subject / Section</label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(assignQ.data?.data || []).map((a, i) => (
                <button key={i} onClick={() => setSelectedAssignment(a)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${selectedAssignment?._id === a._id
                    ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}>
                  <p className="text-sm font-semibold text-gray-800">{a.subject?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.subject?.code} · Section {a.section?.name}</p>
                  <span className="badge badge-blue mt-1">{a.subject?.type}</span>
                </button>
              ))}
            </div>
            {!assignQ.data?.data?.length && (
              <EmptyState icon={Users} title="No assignments" description="You have no subject assignments." />
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" value={date} max={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Period No.</label>
              <input type="number" min={1} max={8} value={periodNumber}
                onChange={e => setPeriodNumber(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Topic Covered (optional)</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Binary Trees Introduction" className="input" />
          </div>

          <button
            disabled={!selectedAssignment}
            onClick={() => setStep(2)}
            className="btn-primary">
            Continue to Mark Attendance <Users className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2 – Mark */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">{selectedAssignment?.subject?.name} — Section {selectedAssignment?.section?.name}</p>
              <p className="text-xs text-gray-500">{date} · Period {periodNumber} · {startTime}–{endTime}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600 font-semibold">{presentCount + lateCount} / {students.length} present</span>
              <button onClick={() => setStep(1)} className="btn-secondary btn-sm">← Back</button>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex gap-2">
            <button onClick={() => setAll('present')} className="btn-success btn-sm">All Present</button>
            <button onClick={() => setAll('absent')}  className="btn-danger btn-sm">All Absent</button>
          </div>

          {studentsQ.isLoading ? <PageLoader /> : students.length === 0 ? (
            <div className="card"><EmptyState icon={Users} title="No students" /></div>
          ) : (
            <div className="card divide-y divide-gray-100">
              {students.map((s, i) => {
                const status = records[s._id] || 'absent';
                return (
                  <div key={s._id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.user?.name}</p>
                        <p className="text-xs text-gray-400">{s.rollNo} · {s.enrollmentNo}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {STATUS_OPTS.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <button key={opt.value} onClick={() => setRecords(r => ({ ...r, [s._id]: opt.value }))}
                            title={opt.label}
                            className={`p-1.5 rounded-lg border transition-all ${status === opt.value ? `${opt.bg} border-2` : 'border-gray-200 hover:bg-gray-50'}`}>
                            <Icon className={`w-4 h-4 ${status === opt.value ? opt.color : 'text-gray-400'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={handleSubmit} disabled={markMutation.isPending || students.length === 0} className="btn-primary w-full sm:w-auto">
            {markMutation.isPending
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send className="w-4 h-4" />}
            Submit Attendance
          </button>
        </div>
      )}
    </div>
  );
}
