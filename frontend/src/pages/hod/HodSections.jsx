import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { hodAPI } from '../../api/hod';
import { PageLoader } from '../../components/shared/Spinner';
import { ErrorAlert } from '../../components/shared/ErrorAlert';
import { EmptyState } from '../../components/shared/EmptyState';
import { BookMarked, ArrowRight } from 'lucide-react';

export default function HodSections() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey:['hod-sections'], queryFn:() => hodAPI.getSections() });
  if (isLoading) return <PageLoader />;
  if (error)     return <ErrorAlert message={error.message} onRetry={refetch} />;
  const sections = data?.data || [];
  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Sections</h1><p className="page-subtitle">All sections in your department</p></div>
      {sections.length === 0 ? <div className="card"><EmptyState icon={BookMarked} title="No sections" /></div> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xl font-bold text-gray-800">Section {s.name}</p>
                  <p className="text-sm text-gray-500">Year {s.year} · Semester {s.semester}</p>
                </div>
                <span className="badge badge-blue">{s.academicSession?.academicYear}</span>
              </div>
              <p className="text-sm text-gray-600">Students: <b>{s.studentCount ?? '—'}</b></p>
              <p className="text-sm text-gray-600">Max Strength: <b>{s.maxStrength}</b></p>
              <Link to={`/hod/attendance/section/${s._id}`}
                className="mt-3 flex items-center gap-1 text-xs text-primary-600 hover:underline">
                View attendance matrix <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
