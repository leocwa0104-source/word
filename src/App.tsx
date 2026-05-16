import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import WordDetail from "@/pages/WordDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/w/:word" element={<WordDetail />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
