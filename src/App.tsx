import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { 
  InboxPage, 
  NextActionsPage, 
  CalendarPage, 
  ProjectsPage, 
  WeeklyReviewPage 
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<InboxPage />} />
          <Route path="next-actions" element={<NextActionsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="weekly-review" element={<WeeklyReviewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
