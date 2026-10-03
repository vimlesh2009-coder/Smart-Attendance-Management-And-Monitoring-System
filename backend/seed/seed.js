/**
 * Seed Script — Smart Attendance Management System
 * Run: npm run seed
 *
 * CSE: 5 sections (A,B,C,D,E) — 4th Year, Sem 7
 *      10 faculty, 6 subjects, 10 students per section = 50 students
 * ECE: 2 sections (A,B) — 2nd Year, Sem 3
 * ME:  2 sections (A,B) — 2nd Year, Sem 3
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');

const User              = require('../src/models/User');
const AcademicSession   = require('../src/models/AcademicSession');
const Department        = require('../src/models/Department');
const Section           = require('../src/models/Section');
const Faculty           = require('../src/models/Faculty');
const Student           = require('../src/models/Student');
const Subject           = require('../src/models/Subject');
const SubjectAssignment = require('../src/models/SubjectAssignment');
const Timetable         = require('../src/models/Timetable');
const Attendance        = require('../src/models/Attendance');
const FeeRecord         = require('../src/models/FeeRecord');
const Announcement      = require('../src/models/Announcement');
const CalendarEvent     = require('../src/models/CalendarEvent');

// ─── Utilities ────────────────────────────────────────────────────────────────
const pad  = (n) => String(n).padStart(2, '0');
const log  = (msg) => console.log(`  ✓  ${msg}`);
const info = (msg) => console.log(`\n── ${msg}`);

const pickStatus = (idx) => {
  const r = Math.random();
  if (idx <= 5) return r < 0.87 ? 'present' : r < 0.93 ? 'late' : 'absent';
  if (idx <= 7) return r < 0.68 ? 'present' : r < 0.73 ? 'late' : 'absent';
  return r < 0.52 ? 'present' : r < 0.55 ? 'late' : 'absent';
};

const getWorkingDays = (n) => {
  const days = [];
  const cur = new Date();
  cur.setHours(10, 0, 0, 0);
  while (days.length < n) {
    cur.setDate(cur.getDate() - 1);
    if (cur.getDay() !== 0 && cur.getDay() !== 6) days.unshift(new Date(cur));
  }
  return days;
};

// ─── Department Definitions ───────────────────────────────────────────────────
const DEPT_DATA = [

  // ══════════════════════════════════════════════════════
  //  CSE  —  4th Year (Sem 7)  —  5 Sections A B C D E
  // ══════════════════════════════════════════════════════
  {
    name: 'Computer Science & Engineering',
    code: 'CSE',
    year: 4, semester: 7,
    sections: ['A', 'B', 'C', 'D', 'E'],
    studentsPerSection: 10,
    hod: {
      name: 'Dr. Anil Sharma', email: 'hod.cse@college.edu',
      empId: 'EMP001', spec: 'Machine Learning & AI',
    },
    faculty: [
      { name: 'Prof. Kavya Reddy',   email: 'kavya.r@college.edu',   empId: 'EMP101', desig: 'Associate Professor', spec: 'Machine Learning' },
      { name: 'Prof. Suresh Kumar',  email: 'suresh.k@college.edu',  empId: 'EMP102', desig: 'Assistant Professor', spec: 'Cloud Computing' },
      { name: 'Prof. Meena Iyer',    email: 'meena.i@college.edu',   empId: 'EMP103', desig: 'Associate Professor', spec: 'Software Engineering' },
      { name: 'Prof. Arjun Patel',   email: 'arjun.p@college.edu',   empId: 'EMP104', desig: 'Assistant Professor', spec: 'Web Technologies' },
      { name: 'Prof. Divya Singh',   email: 'divya.s@college.edu',   empId: 'EMP105', desig: 'Lecturer',            spec: 'Big Data Analytics' },
      { name: 'Prof. Rohit Sharma',  email: 'rohit.s@college.edu',   empId: 'EMP106', desig: 'Assistant Professor', spec: 'Information Security' },
      { name: 'Prof. Priya Gupta',   email: 'priya.g@college.edu',   empId: 'EMP107', desig: 'Assistant Professor', spec: 'Distributed Systems' },
      { name: 'Prof. Amit Verma',    email: 'amit.v@college.edu',    empId: 'EMP108', desig: 'Lecturer',            spec: 'Mobile Computing' },
      { name: 'Prof. Sneha Joshi',   email: 'sneha.j@college.edu',   empId: 'EMP109', desig: 'Assistant Professor', spec: 'Computer Networks' },
      { name: 'Prof. Vikash Tiwari', email: 'vikash.t@college.edu',  empId: 'EMP110', desig: 'Lecturer',            spec: 'AI & Deep Learning' },
    ],
    subjects: [
      { name: 'Machine Learning',           code: 'CSE701', type: 'theory',    credits: 4, weekly: 4 },
      { name: 'Cloud Computing',            code: 'CSE702', type: 'theory',    credits: 4, weekly: 4 },
      { name: 'Software Engineering',       code: 'CSE703', type: 'theory',    credits: 3, weekly: 3 },
      { name: 'Information Security',       code: 'CSE704', type: 'theory',    credits: 3, weekly: 3 },
      { name: 'Big Data Analytics',         code: 'CSE705', type: 'elective',  credits: 3, weekly: 3 },
      { name: 'ML & Cloud Lab',             code: 'CSE706', type: 'lab',       credits: 2, weekly: 4 },
    ],
    // Day-wise timetable template (period index maps to subjects array)
    // Each day: [sub0_idx, sub1_idx, sub2_idx, sub3_idx, sub4_idx, sub5_idx]
    timetableTemplate: {
      Monday:    [0, 1, 2, 5, 3, 4],
      Tuesday:   [1, 0, 3, 2, 5, 4],
      Wednesday: [2, 3, 0, 4, 1, 5],
      Thursday:  [3, 2, 1, 5, 0, 4],
      Friday:    [4, 5, 3, 0, 2, 1],
    },
  },

  // ══════════════════════════════════════════════════════
  //  ECE  —  2nd Year (Sem 3)  —  2 Sections A B
  // ══════════════════════════════════════════════════════
  {
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    year: 2, semester: 3,
    sections: ['A', 'B'],
    studentsPerSection: 10,
    hod: {
      name: 'Dr. Priya Nair', email: 'hod.ece@college.edu',
      empId: 'EMP002', spec: 'VLSI Design',
    },
    faculty: [
      { name: 'Prof. Vikram Rao',   email: 'vikram.r@college.edu',  empId: 'EMP201', desig: 'Assistant Professor', spec: 'Digital Electronics' },
      { name: 'Prof. Sunita Menon', email: 'sunita.m@college.edu',  empId: 'EMP202', desig: 'Associate Professor', spec: 'Signal Processing' },
      { name: 'Prof. Ramesh Nair',  email: 'ramesh.n@college.edu',  empId: 'EMP203', desig: 'Assistant Professor', spec: 'Communication Systems' },
      { name: 'Prof. Anitha Bose',  email: 'anitha.b@college.edu',  empId: 'EMP204', desig: 'Assistant Professor', spec: 'Microprocessors' },
      { name: 'Prof. Kiran Joshi',  email: 'kiran.j@college.edu',   empId: 'EMP205', desig: 'Lecturer',            spec: 'Circuit Theory' },
    ],
    subjects: [
      { name: 'Digital Signal Processing',     code: 'ECE301', type: 'theory',    credits: 4, weekly: 4 },
      { name: 'Analog Communication',          code: 'ECE302', type: 'theory',    credits: 3, weekly: 3 },
      { name: 'Microprocessors & Interfacing', code: 'ECE303', type: 'theory',    credits: 4, weekly: 4 },
      { name: 'Electronics Lab',               code: 'ECE304', type: 'practical', credits: 2, weekly: 2 },
    ],
    timetableTemplate: {
      Monday:    [0, 1, 2, 3, 0, 1],
      Tuesday:   [1, 2, 0, 3, 2, 0],
      Wednesday: [2, 0, 3, 1, 0, 2],
      Thursday:  [3, 1, 0, 2, 1, 3],
      Friday:    [0, 3, 1, 2, 3, 0],
    },
  },

  // ══════════════════════════════════════════════════════
  //  ME  —  2nd Year (Sem 3)  —  2 Sections A B
  // ══════════════════════════════════════════════════════
  {
    name: 'Mechanical Engineering',
    code: 'ME',
    year: 2, semester: 3,
    sections: ['A', 'B'],
    studentsPerSection: 10,
    hod: {
      name: 'Dr. Rajesh Verma', email: 'hod.me@college.edu',
      empId: 'EMP003', spec: 'Thermal Engineering',
    },
    faculty: [
      { name: 'Prof. Prakash Gupta',  email: 'prakash.g@college.edu', empId: 'EMP301', desig: 'Associate Professor', spec: 'Fluid Mechanics' },
      { name: 'Prof. Lakshmi Pillai', email: 'lakshmi.p@college.edu', empId: 'EMP302', desig: 'Assistant Professor', spec: 'Thermodynamics' },
      { name: 'Prof. Manoj Tiwari',   email: 'manoj.t@college.edu',   empId: 'EMP303', desig: 'Assistant Professor', spec: 'Machine Design' },
      { name: 'Prof. Saranya Das',    email: 'saranya.d@college.edu', empId: 'EMP304', desig: 'Assistant Professor', spec: 'Manufacturing' },
      { name: 'Prof. Deepak Mishra',  email: 'deepak.m@college.edu',  empId: 'EMP305', desig: 'Lecturer',            spec: 'Engineering Drawing' },
    ],
    subjects: [
      { name: 'Fluid Mechanics',    code: 'ME301', type: 'theory',    credits: 4, weekly: 4 },
      { name: 'Thermodynamics',     code: 'ME302', type: 'theory',    credits: 4, weekly: 4 },
      { name: 'Theory of Machines', code: 'ME303', type: 'theory',    credits: 3, weekly: 3 },
      { name: 'Workshop Practice',  code: 'ME304', type: 'practical', credits: 2, weekly: 2 },
    ],
    timetableTemplate: {
      Monday:    [0, 1, 2, 3, 0, 1],
      Tuesday:   [1, 0, 3, 2, 1, 3],
      Wednesday: [2, 3, 0, 1, 2, 0],
      Thursday:  [3, 2, 1, 0, 3, 2],
      Friday:    [0, 1, 2, 3, 1, 0],
    },
  },
];

const TIME_SLOTS = [
  { period: 1, start: '09:00', end: '09:50' },
  { period: 2, start: '09:55', end: '10:45' },
  { period: 3, start: '11:00', end: '11:50' },
  { period: 4, start: '11:55', end: '12:45' },
  { period: 5, start: '14:00', end: '14:50' },
  { period: 6, start: '14:55', end: '15:45' },
];

const STUDENT_FIRST = ['Aarav','Ananya','Arjun','Diya','Ishaan','Kavya','Nikhil','Pooja','Rahul','Riya'];
const STUDENT_LAST  = ['Agarwal','Bose','Chandra','Das','Gupta','Joshi','Kumar','Mehta','Nair','Patel'];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Smart Attendance System  —  Full Seed Script          ║');
  console.log('║   CSE: 5 Sections (A-E) | 4th Year | 50 Students       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, family: 4 });
  log('Connected to MongoDB Atlas');

  // ── Clear all ──────────────────────────────────────────────────────────────
  info('Clearing existing data');
  await Promise.all([
    User.deleteMany({}), AcademicSession.deleteMany({}), Department.deleteMany({}),
    Section.deleteMany({}), Faculty.deleteMany({}), Student.deleteMany({}),
    Subject.deleteMany({}), SubjectAssignment.deleteMany({}), Timetable.deleteMany({}),
    Attendance.deleteMany({}), FeeRecord.deleteMany({}),
    Announcement.deleteMany({}), CalendarEvent.deleteMany({}),
  ]);
  log('All collections cleared');

  // ── Admin ──────────────────────────────────────────────────────────────────
  info('Creating Admin');
  const adminUser = await User.create({
    name: 'System Administrator', email: 'admin@college.edu',
    password: 'Admin@123', role: 'admin', phone: '9000000001', isActive: true,
  });
  log('admin@college.edu / Admin@123');

  // ── Academic Session ───────────────────────────────────────────────────────
  info('Creating Academic Session');
  const session = await AcademicSession.create({
    name: '2025-2026 Odd Semester', academicYear: '2025-2026',
    semester: 'odd', startDate: new Date('2025-07-15'), endDate: new Date('2025-12-15'),
    isCurrent: true, totalWorkingDays: 90,
    description: 'Odd semester – 2025-2026', createdBy: adminUser._id,
  });
  log(session.name);

  // ── Per-department data store ──────────────────────────────────────────────
  const allDepts         = [];
  const allFacByDept     = {};
  const allSubByDept     = {};
  const allSecsByDept    = {};
  const studentsBySection = {};

  let globalSeq = 1; // student sequence counter

  // ══════════════════════════════════════════════════════════════════════════
  //  LOOP OVER DEPARTMENTS
  // ══════════════════════════════════════════════════════════════════════════
  for (const dd of DEPT_DATA) {

    info(`Setting up department: ${dd.code}`);

    // ── HOD ─────────────────────────────────────────────────────────────────
    const hodUser = await User.create({
      name: dd.hod.name, email: dd.hod.email, password: 'Hod@123',
      role: 'hod',
      phone: `9${String(allDepts.length + 100000001).slice(-9)}`,
      isActive: true,
    });
    const dept = await Department.create({
      name: dd.name, code: dd.code,
      description: `Department of ${dd.name}`,
      isActive: true, establishedYear: 1995, createdBy: adminUser._id,
    });
    await Faculty.create({
      user: hodUser._id, employeeId: dd.hod.empId, department: dept._id,
      designation: 'HOD', qualification: 'Ph.D', specialization: dd.hod.spec,
      joiningDate: new Date('2010-06-01'), isActive: true,
    });
    dept.hod = hodUser._id;
    await dept.save();
    allDepts.push(dept);
    log(`${dd.code} HOD: ${dd.hod.email} / Hod@123`);

    // ── Faculty ──────────────────────────────────────────────────────────────
    allFacByDept[dd.code] = [];
    for (const fd of dd.faculty) {
      const fUser = await User.create({
        name: fd.name, email: fd.email, password: 'Faculty@123', role: 'faculty',
        phone: `9${fd.empId.replace(/\D/g,'').padStart(9,'0').slice(-9)}`, isActive: true,
      });
      const fDoc = await Faculty.create({
        user: fUser._id, employeeId: fd.empId, department: dept._id,
        designation: fd.desig, qualification: 'M.Tech', specialization: fd.spec,
        joiningDate: new Date('2018-07-01'), isActive: true,
      });
      allFacByDept[dd.code].push(fDoc);
    }
    log(`${dd.code}: ${dd.faculty.length} faculty created`);

    // ── Subjects ─────────────────────────────────────────────────────────────
    allSubByDept[dd.code] = [];
    for (const sd of dd.subjects) {
      const sub = await Subject.create({
        name: sd.name, code: sd.code, department: dept._id,
        type: sd.type, credits: sd.credits, weeklyLectures: sd.weekly,
        year: dd.year, semester: dd.semester,
        isActive: true, createdBy: adminUser._id,
      });
      allSubByDept[dd.code].push(sub);
    }
    log(`${dd.code}: ${dd.subjects.length} subjects created`);

    // ── Sections ─────────────────────────────────────────────────────────────
    allSecsByDept[dd.code] = [];
    for (const sName of dd.sections) {
      const sec = await Section.create({
        name: sName, department: dept._id, academicSession: session._id,
        year: dd.year, semester: dd.semester,
        maxStrength: 60, isActive: true, createdBy: adminUser._id,
      });
      allSecsByDept[dd.code].push(sec);
    }
    log(`${dd.code}: ${dd.sections.length} sections (${dd.sections.join(', ')}) — Year ${dd.year}`);

    // ── Students ─────────────────────────────────────────────────────────────
    for (let si = 0; si < allSecsByDept[dd.code].length; si++) {
      const sec      = allSecsByDept[dd.code][si];
      const secLabel = dd.sections[si];
      studentsBySection[sec._id.toString()] = [];

      for (let i = 0; i < dd.studentsPerSection; i++) {
        const fn     = STUDENT_FIRST[i];
        const ln     = STUDENT_LAST[globalSeq % STUDENT_LAST.length];
        const name   = `${fn} ${ln}`;
        const email  = `${fn.toLowerCase()}.${dd.code.toLowerCase()}${secLabel.toLowerCase()}${globalSeq}@student.edu`;
        const enroll = `${dd.code}-${dd.year}${secLabel}-${pad(globalSeq)}`;
        const roll   = `${dd.code}${dd.year}${secLabel}${pad(i + 1)}`;

        const sUser = await User.create({
          name, email, password: 'Student@123', role: 'student',
          phone: `9${String(globalSeq + 200000000).slice(-9)}`, isActive: true,
        });
        const stu = await Student.create({
          user: sUser._id, enrollmentNo: enroll, rollNo: roll,
          department: dept._id, section: sec._id, academicSession: session._id,
          year: dd.year, semester: dd.semester,
          gender: i % 2 === 0 ? 'male' : 'female',
          parentName: `Parent of ${name}`,
          parentPhone: `8${String(globalSeq + 200000000).slice(-9)}`,
          admissionDate: new Date('2022-07-15'), isActive: true,
        });
        studentsBySection[sec._id.toString()].push(stu);
        globalSeq++;
      }
      log(`${dd.code}-${secLabel}: ${dd.studentsPerSection} students`);
    }

    // ── Subject Assignments ──────────────────────────────────────────────────
    const subjects = allSubByDept[dd.code];
    const faculty  = allFacByDept[dd.code];

    for (const sec of allSecsByDept[dd.code]) {
      for (let si = 0; si < subjects.length; si++) {
        // Distribute subjects evenly across faculty
        const fac = faculty[si % faculty.length];
        await SubjectAssignment.create({
          faculty: fac._id, subject: subjects[si]._id,
          section: sec._id, academicSession: session._id,
          department: dept._id, assignedBy: adminUser._id, isActive: true,
        });
      }
    }
    log(`${dd.code}: subject assignments created for all sections`);

    // ── Timetable ────────────────────────────────────────────────────────────
    for (const sec of allSecsByDept[dd.code]) {
      for (const [day, subIndices] of Object.entries(dd.timetableTemplate)) {
        const periods = subIndices.map((subIdx, pIdx) => {
          const sub = subjects[subIdx];
          const fac = faculty[subIdx % faculty.length];
          const slot = TIME_SLOTS[pIdx];
          return {
            periodNumber: slot.period,
            startTime:    slot.start,
            endTime:      slot.end,
            subject:      sub._id,
            faculty:      fac._id,
            room:         `${dd.code}-${sec.name}${slot.period}${String(pIdx+1).padStart(2,'0')}`,
            type: sub.type === 'lab' || sub.type === 'practical' ? 'practical' : 'lecture',
          };
        });

        await Timetable.create({
          section: sec._id, academicSession: session._id,
          department: dept._id, day,
          periods, isActive: true, createdBy: adminUser._id,
        });
      }
    }
    log(`${dd.code}: timetables created (Mon–Fri) for all ${dd.sections.length} sections`);

    // ── Attendance (30 working days) ─────────────────────────────────────────
    const workingDays = getWorkingDays(30);

    for (const sec of allSecsByDept[dd.code]) {
      const students = studentsBySection[sec._id.toString()];

      // Build assignMap for this section: subjectId → faculty doc
      const assignMap = {};
      for (let si = 0; si < subjects.length; si++) {
        assignMap[subjects[si]._id.toString()] = faculty[si % faculty.length];
      }

      for (let dayIdx = 0; dayIdx < workingDays.length; dayIdx++) {
        const date = workingDays[dayIdx];
        // 2 subjects per day rotating through all subjects
        const todaySubs = [
          subjects[dayIdx % subjects.length],
          subjects[(dayIdx + 1) % subjects.length],
        ];

        for (let pi = 0; pi < todaySubs.length; pi++) {
          const sub    = todaySubs[pi];
          const fac    = assignMap[sub._id.toString()];
          const period = pi + 1;

          const records = students.map((stu, idx) => ({
            student:  stu._id,
            status:   pickStatus(idx),
            markedBy: fac.user,
            markedAt: new Date(date),
            correctionHistory: [],
          }));

          await Attendance.create({
            subject: sub._id, faculty: fac._id,
            section: sec._id, department: dept._id,
            academicSession: session._id, date,
            lectureType:  sub.type === 'lab' || sub.type === 'practical' ? 'practical' : 'lecture',
            periodNumber: period,
            startTime:    TIME_SLOTS[period - 1].start,
            endTime:      TIME_SLOTS[period - 1].end,
            topic:        `Lecture ${dayIdx + 1} — ${sub.name}`,
            records,
            markedBy: fac.user,
          });
        }
      }
      log(`${dd.code}-${sec.name}: attendance (30 days) done`);
    }

    // ── Fee Records ──────────────────────────────────────────────────────────
    const FEE_TYPES = [
      { feeType: 'tuition',     total: 55000 },
      { feeType: 'examination', total: 2500  },
      { feeType: 'library',     total: 500   },
    ];
    let feeSeq = 1;
    for (const sec of allSecsByDept[dd.code]) {
      for (const stu of studentsBySection[sec._id.toString()]) {
        for (const ft of FEE_TYPES) {
          const paidAmount = [ft.total, ft.total / 2, 0][feeSeq % 3];
          await FeeRecord.create({
            student: stu._id, academicSession: session._id,
            feeType: ft.feeType, totalAmount: ft.total,
            paidAmount, discount: 0,
            fine: paidAmount < ft.total && feeSeq % 5 === 0 ? 200 : 0,
            createdBy: adminUser._id,
          });
          feeSeq++;
        }
      }
    }
    log(`${dd.code}: fee records created`);
  }

  // ── Announcements ──────────────────────────────────────────────────────────
  info('Creating Announcements');
  const announcements = [
    {
      title: 'Mid-Semester Examination Schedule — 4th Year CSE',
      content: 'Mid-semester exams for B.Tech CSE 4th Year (Sem 7) will be held from October 13–18, 2025. All students must carry their hall tickets.',
      type: 'exam', priority: 'high', targetAudience: 'students',
    },
    {
      title: 'Attendance Shortage Warning',
      content: 'Students with attendance below 75% as of September 30, 2025 are notified. Continued shortage may lead to debarment from exams. Contact your HOD immediately.',
      type: 'academic', priority: 'urgent', targetAudience: 'students',
    },
    {
      title: 'Project Viva Schedule — CSE 4th Year',
      content: 'Final year project viva for B.Tech CSE will be conducted from November 10–20, 2025. Students must submit their project reports by November 5.',
      type: 'academic', priority: 'high', targetAudience: 'students',
    },
    {
      title: 'Last Date for Fee Payment — Sem 7',
      content: 'Last date for fee payment is October 31, 2025. Late fee of ₹500 per week will be charged. Contact accounts section for queries.',
      type: 'fee', priority: 'high', targetAudience: 'all',
      expiresAt: new Date('2025-11-15'),
    },
    {
      title: 'TECHFEST 2025 — Annual Technical Symposium',
      content: 'TECHFEST 2025 on November 22–23. Events: paper presentation, project expo, hackathon, robotics. Registrations open now!',
      type: 'event', priority: 'medium', targetAudience: 'all',
    },
    {
      title: 'Faculty Development Programme',
      content: 'FDP on "AI & ML in Engineering Education" — October 7–9, 2025. All faculty members encouraged to attend.',
      type: 'event', priority: 'medium', targetAudience: 'faculty',
    },
  ];

  for (const a of announcements) {
    await Announcement.create({
      ...a, publishedBy: adminUser._id,
      publishedAt: new Date(), isPublished: true,
      academicSession: session._id,
    });
  }
  log(`${announcements.length} announcements created`);

  // ── Calendar Events ────────────────────────────────────────────────────────
  info('Creating Calendar Events');
  const events = [
    { title: 'Odd Semester Begins',          type: 'working_day',   start: '2025-07-15', end: '2025-07-15', holiday: false, color: '#4caf50' },
    { title: 'Independence Day',             type: 'holiday',       start: '2025-08-15', end: '2025-08-15', holiday: true,  color: '#f44336' },
    { title: 'Onam Holidays',                type: 'holiday',       start: '2025-09-04', end: '2025-09-06', holiday: true,  color: '#f44336' },
    { title: 'Internal Assessment I',        type: 'internal_exam', start: '2025-09-22', end: '2025-09-26', holiday: false, color: '#ff9800' },
    { title: 'Gandhi Jayanti',               type: 'holiday',       start: '2025-10-02', end: '2025-10-02', holiday: true,  color: '#f44336' },
    { title: 'Project Report Submission',    type: 'event',         start: '2025-11-05', end: '2025-11-05', holiday: false, color: '#2196f3' },
    { title: 'Diwali Holidays',              type: 'holiday',       start: '2025-10-20', end: '2025-10-23', holiday: true,  color: '#f44336' },
    { title: 'Mid Semester Examinations',    type: 'exam',          start: '2025-10-13', end: '2025-10-18', holiday: false, color: '#9c27b0' },
    { title: 'Project Viva — CSE 4th Year',  type: 'exam',          start: '2025-11-10', end: '2025-11-20', holiday: false, color: '#9c27b0' },
    { title: 'TECHFEST 2025',                type: 'cultural',      start: '2025-11-22', end: '2025-11-23', holiday: false, color: '#00bcd4' },
    { title: 'End Semester Examinations',    type: 'exam',          start: '2025-12-01', end: '2025-12-15', holiday: false, color: '#9c27b0' },
    { title: 'Odd Semester Ends',            type: 'working_day',   start: '2025-12-15', end: '2025-12-15', holiday: false, color: '#4caf50' },
  ];

  for (const ev of events) {
    await CalendarEvent.create({
      title: ev.title, type: ev.type,
      startDate: new Date(ev.start), endDate: new Date(ev.end),
      isHoliday: ev.holiday, isWorkingDay: !ev.holiday,
      isAllDepartments: true, academicSession: session._id,
      color: ev.color, isPublished: true, createdBy: adminUser._id,
    });
  }
  log(`${events.length} calendar events created`);

  // ── Final Summary ──────────────────────────────────────────────────────────
  const totalStudents = Object.values(studentsBySection).reduce((s, arr) => s + arr.length, 0);
  const totalFaculty  = Object.values(allFacByDept).reduce((s, arr) => s + arr.length, 0);
  const totalSections = Object.values(allSecsByDept).reduce((s, arr) => s + arr.length, 0);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                     SEED COMPLETE ✓                         ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  LOGIN CREDENTIALS                                           ║');
  console.log('║  ──────────────────────────────────────────────────────────  ║');
  console.log('║  Admin      → admin@college.edu             / Admin@123      ║');
  console.log('║  HOD CSE    → hod.cse@college.edu           / Hod@123        ║');
  console.log('║  HOD ECE    → hod.ece@college.edu           / Hod@123        ║');
  console.log('║  HOD ME     → hod.me@college.edu            / Hod@123        ║');
  console.log('║  Faculty    → kavya.r@college.edu           / Faculty@123    ║');
  console.log('║  Student CSE-A → aarav.csea1@student.edu    / Student@123    ║');
  console.log('║  Student CSE-B → aarav.cseb11@student.edu   / Student@123    ║');
  console.log('║  Student CSE-C → aarav.csec21@student.edu   / Student@123    ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  DATA SUMMARY                                                ║');
  console.log('║  ──────────────────────────────────────────────────────────  ║');
  console.log(`║  Departments: 3   Total Sections: ${totalSections}   Students: ${totalStudents}          ║`);
  console.log(`║  CSE Sections: A,B,C,D,E (4th Year Sem 7) — 50 students     ║`);
  console.log(`║  ECE Sections: A,B (2nd Year Sem 3) — 20 students            ║`);
  console.log(`║  ME  Sections: A,B (2nd Year Sem 3) — 20 students            ║`);
  console.log(`║  Faculty: ${totalFaculty+3} (incl. HODs)   Subjects: 14   Assignments: done ║`);
  console.log('║  Attendance: 30 days × all sections × 2 subjects/day        ║');
  console.log('║  Fee records, Announcements, Calendar — all created          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n  ✗ Seed failed:', err.message);
  console.error(err.stack);
  mongoose.disconnect();
  process.exit(1);
});
