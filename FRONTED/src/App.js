import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Signup from "./components/signup";
import Login from "./components/login";
import AddNotes from "./components/addnotes";
import Notes from "./components/notes";
import ViewNote from "./components/viewnotes";

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Login />} />
          <Route path="/notes" element={<Notes />} />
        <Route path="/add-note" element={<AddNotes />} />
        <Route path="/notes/:id" element={<ViewNote />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
