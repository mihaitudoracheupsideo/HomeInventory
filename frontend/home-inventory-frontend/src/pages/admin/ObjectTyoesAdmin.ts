// src/pages/ObjectTypesAdmin.js
import React, { useEffect, useState } from "react";
import {
  getObjectTypes,
  createObjectType,
  updateObjectType,
  deleteObjectType,
} from "../api/objectTypeService";

export default function ObjectTypesAdmin() {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const res = await getObjectTypes();
      setTypes(res.data);
    } catch (err) {
      console.error("Eroare la preluarea datelor", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;

    try {
      if (editId) {
        await updateObjectType(editId, form);
      } else {
        await createObjectType(form);
      }
      setForm({ name: "", description: "" });
      setEditId(null);
      loadTypes();
    } catch (err) {
      console.error("Eroare la salvare", err);
    }
  };

  const handleEdit = (type) => {
    setForm({ name: type.name, description: type.description });
    setEditId(type.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Sigur vrei să ștergi acest tip?")) {
      try {
        await deleteObjectType(id);
        loadTypes();
      } catch (err) {
        console.error("Eroare la ștergere", err);
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Object Types</h2>

      {/* Formular Add/Edit */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button type="submit">{editId ? "Update" : "Add"}</button>
        {editId && <button onClick={() => { setEditId(null); setForm({ name: "", description: "" }); }}>Cancel</button>}
      </form>

      {/* Tabel listare */}
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.name}</td>
              <td>{t.description}</td>
              <td>
                <button onClick={() => handleEdit(t)}>Edit</button>
                <button onClick={() => handleDelete(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}