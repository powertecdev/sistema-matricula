import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/StudentsPage";
import EnrollmentsPage from "./pages/EnrollmentsPage";
import PaymentsPage from "./pages/PaymentsPage";
import AccessPage from "./pages/AccessPage";
import ClassroomsPage from "./pages/ClassroomsPage";
import ClassroomDetailPage from "./pages/ClassroomDetailPage";
import AttendancePage from "./pages/AttendancePage";
import FeedbackPage from "./pages/FeedbackPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/enrollments" element={<EnrollmentsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/classrooms" element={<ClassroomsPage />} />
            <Route path="/classrooms/:id" element={<ClassroomDetailPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
      </Route>
      <Route path="/access" element={<AccessPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}