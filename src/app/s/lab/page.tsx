"use client";

// HS: Hình học động — mô phỏng PhET, GeoGebra song ngữ + mô hình 3D thầy cô thêm cho khối của em
import { StudentHeader, StudentShell, useStudent } from "@/components/student/student-shell";
import { LabBrowser } from "@/components/lab/lab";
import { useLabResources } from "@/lib/library/hooks";

export default function LabPage() {
  return (
    <StudentShell>
      <Lab />
    </StudentShell>
  );
}

function Lab() {
  const { cls } = useStudent();
  const resources = useLabResources(cls?.grade);
  return (
    <>
      <StudentHeader vi="Hình học động" en="Dynamic maths" />
      <div className="px-5 pt-5">{cls ? <LabBrowser grade={cls.grade} resources={resources} compact /> : null}</div>
    </>
  );
}
