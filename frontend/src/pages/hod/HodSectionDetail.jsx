import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { hodAPI } from '../../api/hod';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { pctColor, riskLabel } from '../../utils/helpers';

const RISK_CLS = { safe:'badge-green', moderate:'badge-blue', warning:'badge-yellow', critical:'badge-orange', shortage:'badge-red' };

export default function HodSectionDetail() {
  const { sectionId } = useParams();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hod-section-detail', sectionId],
    queryFn: () => hodAPI.getSectionAttendanceDetail(sectionId, { required: 75 }),
  });

  if (isLoading) return <PageLoader />;
  if (error)     return <ErrorAlert message={error.message} onRetry={refetch} />;

  const d        = data?.data || {};
  const students = d.students || [];
  const subjects = d.subjects || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Section {d.section?.name} — Attendance Matrix</h1>
        <p className="page-subtitle">Year {d.section?.year} · Sem {d.section?.semester} · Required: {d.requiredPercentage}%</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="table min-w-[700px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-gray-50 z-10">Student</th>
              <th className="sticky left-0 bg-gray-50 z-10">Roll No</th>
              {subjects.map(s => <th key={s._id}>{s.code}</th>)}
              <th>Overall</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={i}>
                <td className="font-medium whitespace-nowrap">{s.name}</td>
                <td className="text-gray-500">{s.rollNo || s.enrollmentNo}</td>
                {subjects.map(sub => {
                  const stat = s.subjects?.find(x => x.subjectId === sub._id);
                  const pct  = stat?.percentage ?? 0;
                  return (
                    <td key={sub._id} className={`font-semibold text-center ${pctColor(pct, 75)}`}>
                      {stat ? `${pct}%` : '—'}
                    </td>
                  );
                })}
                <td className={`font-bold text-center ${pctColor(s.overallPercentage, 75)}`}>{s.overallPercentage}%</td>
                <td><span className={`badge ${RISK_CLS[s.overallRisk] || 'badge-gray'}`}>{riskLabel(s.overallRisk)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
