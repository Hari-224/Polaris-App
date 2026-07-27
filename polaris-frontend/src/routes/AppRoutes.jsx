import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import PrivateLayout from '../layouts/PrivateLayout';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import LearningPlanner from '../pages/LearningPlanner';
import CreateLearningPlan from '../pages/CreateLearningPlan';
import LearningPlanDetails from '../pages/LearningPlanDetails';
import EditLearningPlan from '../pages/EditLearningPlan';
import LearningResources from '../pages/LearningResources';
import FocusSession from '../pages/FocusSession';
import Analytics from '../pages/Analytics';
import Quiz from '../pages/Quiz';
import Achievements from '../pages/Achievements';
import Profile from '../pages/Profile';
import ExtensionAuth from '../pages/ExtensionAuth';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Publicly accessible layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Authenticated Application layout */}
      <Route
        element={
          <ProtectedRoute>
            <PrivateLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planner" element={<LearningPlanner />} />
        <Route path="/planner/create" element={<CreateLearningPlan />} />
        <Route path="/planner/:id" element={<LearningPlanDetails />} />
        <Route path="/planner/:id/edit" element={<EditLearningPlan />} />
        <Route path="/resources" element={<LearningResources />} />
        <Route path="/focus" element={<FocusSession />} />
        <Route path="/extension-auth" element={<ExtensionAuth />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Fallback route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
