import './index.css';
import { useStore } from './store/useStore';
import Onboarding from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import Courses from './pages/Courses';
import { Planner } from './pages/Planner';
import { StudyNetwork } from './pages/StudyNetwork';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';

function App() {
  const { onboardingComplete, currentPage } = useStore();

  if (!onboardingComplete) {
    return <Onboarding />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'courses':
        return <Courses />;
      case 'planner':
        return <Planner />;
      case 'network':
        return <StudyNetwork />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main>{renderPage()}</main>
      <BottomNav />
    </div>
  );
}

export default App;
