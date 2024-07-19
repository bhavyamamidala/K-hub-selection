import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function NoteList() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', description: '' });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get('http://localhostzz:8000/notes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotes(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert('Session expired. Please log in again.');
        navigate('/login');
      } else {
        console.error('Error fetching notes:', error);
      }
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/notes', newNote, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewNote({ title: '', description: '' });
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleEditNote = async (id, updatedNote) => {
    try {
      await axios.put(`http://localhost:8000/notes/${id}`, updatedNote, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEditingNoteId(null);
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/notes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const NoteItem = ({ note }) => {
    const [editedNote, setEditedNote] = useState(note);
    const isEditing = editingNoteId === note.id;

    const handleSave = () => {
      handleEditNote(note.id, editedNote);
    };

    const handleCancel = () => {
      setEditedNote(note);
      setEditingNoteId(null);
    };

    return (
      <li>
        {isEditing ? (
          <>
            <input
              type="text"
              value={editedNote.title}
              onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
              style={{ width: '100%', height: '40px' }} // Adjusted width and height
            />
            <textarea
              value={editedNote.description}
              onChange={(e) => setEditedNote({ ...editedNote, description: e.target.value })}
              style={{ width: '100%', height: '80px', marginTop: '10px' }} // Adjusted width, height, and margin
            />
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </>
        ) : (
          <>
            {note.title}: {note.description} (Created: {new Date(note.created_at).toLocaleString()})
            <button onClick={() => setEditingNoteId(note.id)}>Edit</button>
            <button onClick={() => handleDelete(note.id)}>Delete</button>
          </>
        )}
      </li>
    );
  };

  return (
    <div>
      <h2>Note List</h2>
      <form onSubmit={handleAddNote}>
        <input
          type="text"
          value={newNote.title}
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
          placeholder="Title"
          required
          style={{ width: '100%', height: '40px' }} // Adjusted width and height
        />
        <textarea
          value={newNote.description}
          onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
          placeholder="Description"
          required
          style={{ width: '100%', height: '80px', marginTop: '10px' }} // Adjusted width, height, and margin
        />
        <button type="submit">Add Note</button>
      </form>
      <ul>
        {notes.map((note) => (
          <NoteItem key={note.id} note={note} />
        ))}
      </ul>
    </div>
  );
}

export default NoteList;
