import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './addnotes.css';
import Navbar from './navbar';

function AddNotes() {
  const [newNote, setNewNote] = useState({ title: '', description: '' });

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/notes', newNote, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewNote({ title: '', description: '' });
      alert('Note added successfully!');
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to add note. Please try again.');
    }
  };

  return (
    <div>
      <Navbar/>
      <div className='add-notespage'>
    <div className="add-notes-container">
      <h2>Add Note</h2>
      <form onSubmit={handleAddNote}>
        <input
          type="text"
          value={newNote.title}
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
          placeholder="Title"
          required
          className="input-field"
        />
        <textarea
          value={newNote.description}
          onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
          placeholder="Description"
          required
          className="input-field"
        />
        <button type="submit" className="add-note-button">Add Note</button>
      </form>

      {/* View Notes Button/Link */}
      <div className="view-notes-button">
        <Link to="/notes">View Notes</Link>
      </div>
    </div>
    </div>
    </div>
  );
}

export default AddNotes;
