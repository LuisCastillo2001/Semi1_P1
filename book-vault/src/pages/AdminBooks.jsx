import React, { useEffect, useState } from 'react';
import { TextField, Button, Box, Typography, Grid, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

export default function AdminBooks() {
  const [books, setBooks] = useState([]);

  const fetchBooks = async () => {
    try {
      const response = await fetch("http://backend-1289678215.us-east-1.elb.amazonaws.com/admin/books");
      const data = await response.json();
      
      if (data.books) {
        const booksWithUrls = data.books.map(book => ({
          id: book.id_libro,
          p_nombre_libro: book.nombre_libro,
          p_url_portada: book.url_portada,
          p_sinopsis: book.sinopsis,
          p_autor: book.autor,
          p_url_pdf: book.url_pdf,
          p_anio_publicacion: book.anio_publicacion
        }));

        setBooks(booksWithUrls);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const [form, setForm] = useState({
    p_nombre_libro: '',
    p_url_portada: null,
    p_sinopsis: '',
    p_autor: '',
    p_anio_publicacion: '',
    p_url_pdf: null,
  });
  
  const [editingIndex, setEditingIndex] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formData = new FormData();
  
    formData.append("id_libro", books[editingIndex]?.id);
    formData.append("p_nombre_libro", form.p_nombre_libro);
    formData.append("p_sinopsis", form.p_sinopsis);
    formData.append("p_autor", form.p_autor);
    formData.append("p_anio_publicacion", form.p_anio_publicacion);
    
    if (form.p_url_portada) {
      formData.append("p_url_portada", form.p_url_portada); 
    }
  
    if (form.p_url_pdf) {
      formData.append("p_url_pdf", form.p_url_pdf); 
    }
  
    try {
      let response;
      if (editingIndex !== null) {
        
        response = await fetch(`http://backend-1289678215.us-east-1.elb.amazonaws.com/admin/updateBook`, {
          method: "PUT",
          body: formData,
        });
        
        
      } else {
        response = await fetch("http://backend-1289678215.us-east-1.elb.amazonaws.com/admin/uploadBook", {
          method: "POST",
          body: formData,
        });
      }
  
      if (!response.ok) {
        throw new Error("Error al guardar el libro");
      }
      
      await fetchBooks();
  
      setForm({
        p_nombre_libro: "",
        p_url_portada: null,
        p_sinopsis: "",
        p_autor: "",
        p_anio_publicacion: "",
        p_url_pdf: null,
      });
  
      setEditingIndex(null);
      setOpenModal(false);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEdit = (index) => {
    const bookToEdit = books[index];
  
    setForm({
      ...bookToEdit,
      p_url_portada: null,
      p_url_pdf: null
    });
  
    setEditingIndex(index);
    setOpenModal(true);
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prevForm) => ({
        ...prevForm,
        [fieldName]: file,
      }));
    }
  };

  const handleDelete = async (index) => {
    const book = books[index];
    console.log(book)
    try {
      const response = await fetch(`http://backend-1289678215.us-east-1.elb.amazonaws.com/admin/deleteBook/${book.id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setBooks(books.filter((_, idx) => idx !== index));
      } else {
        console.error("Error al eliminar el libro");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    p_nombre_libro: "",
    p_autor: "",
    p_categorias_libro: ""
  });
  
  const [assigFrom2, setAssignForm2] = useState({
    nombre_libro: "",
    autor: "",
    categorias: ""
  });
  const handleAssignChange = (e) => 
    setAssignForm({ ...assignForm, [e.target.name]: e.target.value });
  
  const handleAssignSubmit = async (e) => {
    assigFrom2.nombre_libro = assignForm.p_nombre_libro;
    assigFrom2.autor = assignForm.p_autor;
    assigFrom2.categorias = assignForm.p_categorias_libro;
    console.log(assigFrom2)
    e.preventDefault();
    try {
      const response = await fetch("http://backend-1289678215.us-east-1.elb.amazonaws.com/admin/assignCategory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assigFrom2)
      });
      
      if (!response.ok) {
        throw new Error("Error al asignar categorías");
      }
      // Resetear y cerrar modal
      setAssignForm({ p_nombre_libro: "", p_autor: "", p_categorias_libro: "" });
      setAssignOpen(false);
    } catch (error) {
      console.error("Error asignando categorías:", error);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => { 
            setEditingIndex(null); 
            setForm({
              p_nombre_libro: "",
              p_url_portada: null,
              p_sinopsis: "",
              p_autor: "",
              p_anio_publicacion: "",
              p_url_pdf: null,
            });
            setOpenModal(true);
          }}
        >
          Agregar Libro
        </Button>
        <Button variant="outlined" sx={{ ml: 2 }} onClick={() => setAssignOpen(true)}>
          Asignar Categorías
        </Button>
      </Box>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingIndex !== null ? "Actualizar Libro" : "Agregar Libro"}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre del Libro"
              name="p_nombre_libro"
              value={form.p_nombre_libro}
              onChange={handleChange}
              required
              inputProps={{ maxLength: 75 }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "p_url_portada")}
              
            />
            <TextField
              label="Sinopsis"
              name="p_sinopsis"
              value={form.p_sinopsis}
              onChange={handleChange}
              required
              multiline
            />
            <TextField
              label="Autor"
              name="p_autor"
              value={form.p_autor}
              onChange={handleChange}
              required
              inputProps={{ maxLength: 75 }}
            />
            <TextField
              label="Año de Publicación"
              name="p_anio_publicacion"
              type="date"
              value={form.p_anio_publicacion}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileChange(e, "p_url_pdf")}
              
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingIndex !== null ? "Actualizar Libro" : "Agregar Libro"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Asignar Categorías</DialogTitle>
        <Box component="form" onSubmit={handleAssignSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre del Libro"
              name="p_nombre_libro"
              value={assignForm.p_nombre_libro}
              onChange={handleAssignChange}
              required
            />
            <TextField
              label="Nombre del Autor"
              name="p_autor"
              value={assignForm.p_autor}
              onChange={handleAssignChange}
              required
            />
            <TextField
              label="Categorías (separadas por comas)"
              name="p_categorias_libro"
              value={assignForm.p_categorias_libro}
              onChange={handleAssignChange}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Asignar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Libros Agregados
      </Typography>
      <Grid container spacing={2}>
        {books.map((book, index) => (
          <Grid item xs={12} md={3} key={index}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <img 
                src={book.p_url_portada} 
                alt={book.p_nombre_libro} 
                style={{ width: '150px', height: 'auto', marginBottom: '1rem' }} 
              />
              <Typography variant="h6">{book.p_nombre_libro}</Typography>
              <Typography variant="body2" color="text.secondary">{book.p_autor}</Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={() => handleEdit(index)}>
                  Editar
                </Button>
                <Button variant="outlined" color="error" onClick={() => handleDelete(index)}>
                  Eliminar
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}