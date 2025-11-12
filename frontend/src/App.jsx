import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Home from './pages/home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateFlashcard from './pages/CreateFlashcard';
import Community from './pages/Community';
import CommunitySet from './pages/CommunitySet';
import UploadPDF from './pages/UploadPDF';
import Study from './pages/Study';
import Share from './pages/Share';
import AiTutor from './pages/AiTutor';
import Group from './pages/Group';
import Library from './pages/Library';
import GameSelect from './pages/GameSelect';
import MatchGame from './pages/MatchGame';
import MultipleChoice from './pages/MultipleChoice';
import SentenceChoice from './pages/SentenceChoice';
import SentenceChoiceGame from './pages/SentenceChoiceGame';

function App() {
  const location = useLocation();
  const hideNavAndHeader = location.pathname === '/login' || location.pathname === '/register';
  return (
    <div className="app-container">
      {!hideNavAndHeader && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/library" element={<Library />} />
          <Route path="/study" element={<Study />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create-flashcard" element={<CreateFlashcard />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community-set" element={<CommunitySet />} />
          {/* <Route path="/upload-pdf" element={<UploadPDF />} />
          <Route path="/share" element={<Share />} /> */}
          <Route path="/statistic" element={<AiTutor />} />
          <Route path="/ai-tutor" element={<AiTutor />} />
          {/* <Route path="/group" element={<Group />} /> */}
          <Route path="/games" element={<GameSelect />} />
          <Route path="/games/match" element={<MatchGame />} />
          <Route path="/games/multiple" element={<MultipleChoice />} />
          <Route path="/games/type" element={<SentenceChoice />} />
          <Route path="/games/Sentence" element={<SentenceChoiceGame />} />
        </Routes>
      </main>
      {!hideNavAndHeader && <BottomNav />}
    </div>
  );
}

export default App;
