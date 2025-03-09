import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import { createTheme } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LogoutIcon from '@mui/icons-material/Logout';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { useDemoRouter } from '@toolpad/core/internal';
import Avatar from '@mui/material/Avatar';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BookCard from './Card';
import AddIcon from '@mui/icons-material/Add';
import AdminBooks from "../pages/AdminBooks";
import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

let imgProfile = 'https://img.freepik.com/vector-gratis/configuracion-icono-tecnologia-vector-engranaje-neon-purpura-sobre-fondo-degradado_53876-112151.jpg?semt=ais_hybrid_1_1_m_p0_t0';

const NAVIGATION = [
  { segment: 'inicio', title: 'Inicio', icon: <HomeIcon /> },
  { segment: 'perfil', title: 'Mi Perfil', icon: <Avatar src={imgProfile} /> },
  { segment: 'mis-libros', title: 'Mis Libros', icon: <MenuBookIcon /> },
  { segment: 'logout', title: 'Cerrar Sesión', icon: <LogoutIcon onClick={handleLogout}/> },
];

const demoTheme = createTheme({
  cssVariables: { colorSchemeSelector: 'data-toolpad-color-scheme' },
  colorSchemes: { light: true, dark: true },
  breakpoints: { values: { xs: 0, sm: 600, md: 960, lg: 1200, xl: 1536 } },
});

const books = [
  { image: '/potter.jpg', title: 'Harry Potter', author: 'J.K. Rowling' },
  { image: '/lotr.jpg', title: 'El Señor de los Anillos', author: 'J.R.R. Tolkien' },
  { image: '/dune.jpg', title: 'Dune', author: 'Frank Herbert' },
  { image: '/foundation.jpg', title: 'Fundación', author: 'Isaac Asimov' },
  { image: '/mockingbird.jpg', title: 'Matar a un Ruiseñor', author: 'Harper Lee' },
];

function handleLogout() {
  console.log('aaaaaaa')
  window.location.href = '/'; // Redirigir al login
}


function DemoPageContent({ pathname }) {
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [userBooks, setUserBooks] = useState([]);
  // Añadir nuevo estado para los libros en "inicio"
  const [apiBooks, setApiBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);

  const handleOpenBook = (book) => {
    setSelectedBook(book);
  };

  const handleCloseBook = () => {
    setSelectedBook(null);
  };

  const fetchUserBooks = async () => {
    const userData = JSON.parse(localStorage.getItem('user')) || {};
    const id_usuario = userData.id_usuario;
    try {
      const response = await fetch(`http://backend-1289678215.us-east-1.elb.amazonaws.com/user/books/${id_usuario}`);
      const data = await response.json();
      setApiBooks(data.books || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcquireBook = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const id_usuario = userData.id_usuario;
      const id_book = selectedBook.id_libro;
      const response = await fetch("http://backend-1289678215.us-east-1.elb.amazonaws.com/user/getBook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_user: id_usuario, id_book: id_book })
      });
      const data = await response.json();
      if (data.message === "Libro adquirido") {
        alert("Libro adquirido correctamente");
        if (pathname === '/inicio') {
          fetchUserBooks(); // Recargar libros sin recargar la página
        }
      } else {
        alert("No se pudo adquirir el libro");
      }
    } catch (error) {
      console.error("Error al adquirir el libro:", error);
      alert("Error al adquirir el libro");
    }
    handleCloseBook();
  };

  // Recuperar datos del usuario del localStorage
  const userData = JSON.parse(localStorage.getItem('user')) || {};
  imgProfile = userData.p_url_foto_perfil;
  // Estado de usuario
  const [user, setUser] = useState({
    id_usuario: userData.id_usuario || "",
    p_nombre: userData.p_nombre || "",
    p_apellido: userData.p_apellido || "",
    p_correo: userData.p_correo || "",
    p_fecha_nacimiento: "",
    p_url_foto_perfil: userData.p_url_foto_perfil || '/perfil.jpg',
    p_contrasenia: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);

  // Manejo de cambios en inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  // Manejo de cambio de imagen
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUser({ ...user, p_url_foto_perfil: URL.createObjectURL(file) });
    }
  };

  // Guardar datos en FormData y enviar
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("id_usuario", user.id_usuario);
    formData.append("p_nombre", user.p_nombre);
    formData.append("p_apellido", user.p_apellido);
    formData.append("p_correo", user.p_correo);
    formData.append("p_fecha_nacimiento", user.p_fecha_nacimiento);
    if (selectedFile) formData.append("p_url_foto_perfil", selectedFile);
    if (user.p_contrasenia) formData.append("p_contrasenia", user.p_contrasenia);

    console.log("Datos enviados:", Object.fromEntries(formData));

    // Guardar datos en localStorage
    localStorage.setItem('user', JSON.stringify({
        id_usuario: user.id_usuario,
        p_nombre: user.p_nombre,
        p_apellido: user.p_apellido,
        p_correo: user.p_correo,
        p_url_foto_perfil: user.p_url_foto_perfil,
    }));

    try {
        // Petición al servidor con `await`
        let response = await fetch('http://backend-1289678215.us-east-1.elb.amazonaws.com/user/updateProfile', {
            method: 'PUT',
            body: formData,
        });

        // Esperar la respuesta en JSON
        let data = await response.json();
        
        console.log("Respuesta del servidor:", data);

        if (!response.ok) {
            throw new Error(data.message || "Error al actualizar datos");
        }

        alert("Datos actualizados correctamente");

    } catch (error) {
        console.error("Error:", error.message);
        alert("Error al actualizar datos: " + error.message);
    }
};


  const handleSearch = () => {
    console.log('Buscando...');
  };

  useEffect(() => {
    
    if (pathname === '/mis-libros') {
      const userData = JSON.parse(localStorage.getItem('user')) || {};
      const id_usuario = userData.id_usuario;
      fetch(`http://backend-1289678215.us-east-1.elb.amazonaws.com/user/books/${id_usuario}`)
        .then(response => response.json())
        .then(data => {
          // Se asume que la respuesta contiene la propiedad "books"
          setUserBooks(data.books || []);
        })
        .catch(err => console.error(err));
    }
  }, [pathname]);

  // Agregar nuevo useEffect para "inicio"
  useEffect(() => {
    if (pathname === '/inicio') {
      fetchUserBooks();
    }
  }, [pathname]);

  // Modificar derivación de filteredBooks en la sección "inicio"
  const filteredBooks = apiBooks.filter((book) =>
    book.nombre_libro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box
      sx={{
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
      }}
    >
  {pathname === '/perfil' && (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        p: 3,
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Avatar src={user.p_url_foto_perfil} sx={{ width: 80, height: 80, mb: 1 }} />
      <Typography variant="h6">Mi perfil</Typography>

      {/* Campos editables */}
      <TextField
        fullWidth
        label="Nombre"
        name="p_nombre"
        variant="outlined"
        value={user.p_nombre}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        label="Apellido"
        name="p_apellido"
        variant="outlined"
        value={user.p_apellido}
        onChange={handleChange}
      />
      <TextField
        fullWidth
        label="Correo"
        name="p_correo"
        variant="outlined"
        type="email"
        value={user.p_correo}
        onChange={handleChange}
      />
      
      <TextField
        fullWidth
        label="Contraseña"
        name="p_contrasenia"
        variant="outlined"
        type={showPassword ? "text" : "password"}
        value={user.p_contrasenia}
        onChange={handleChange}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

     {/* Subir imagen */}
     <Button variant="contained" component="label">
        Subir Imagen
        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
      </Button>

        {/* Mostrar nombre y extensión del archivo */}
        {selectedFile && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Archivo seleccionado: {selectedFile.name}
          </Typography>
        )}

      {/* Botón para guardar */}
      <Button type="submit" variant="contained" color="primary">
        Guardar Cambios
      </Button>
  </Box>
)}

      {pathname === '/inicio' && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, width: '80%' }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Buscar libro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained">Filtros</Button>
          </Box>

          <Grid container spacing={3} justifyContent="center">
            {filteredBooks.map((book) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={book.id_libro}>
                <Box onClick={() => handleOpenBook(book)} sx={{ cursor: 'pointer' }}>
                  <BookCard 
                    image={book.url_portada} 
                    title={book.nombre_libro} 
                    author={book.autor} 
                  />
                </Box>
                <Button 
                  variant="contained" 
                  size="small" 
                  sx={{ 
                    backgroundColor: book.Estado_libro === 'No adquirido' ? 'red' : 'green',
                    mt: 1,
                    ':hover': { backgroundColor: book.Estado_libro === 'No adquirido' ? 'darkred' : 'darkgreen' }
                  }}
                >
                  {book.Estado_libro}
                </Button>
              </Grid>
            ))}
          </Grid>

          {/* Modal para mostrar la información completa del libro con diseño mejorado */}
          {selectedBook && (
            <Dialog open onClose={handleCloseBook} fullWidth maxWidth="sm">
              <DialogTitle>{selectedBook.nombre_libro}</DialogTitle>
              <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                  <img 
                    src={selectedBook.url_portada} 
                    alt={selectedBook.nombre_libro}
                    style={{ width: '150px', borderRadius: '8px' }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body1"><strong>ID:</strong> {selectedBook.id_libro}</Typography>
                    <Typography variant="body1"><strong>Autor:</strong> {selectedBook.autor}</Typography>
                    <Typography variant="body1"><strong>Sinopsis:</strong> {selectedBook.sinopsis}</Typography>
                    <Typography variant="body1">
                      <strong>URL PDF:</strong> <a href={selectedBook.url_pdf} target="_blank" rel="noopener noreferrer">{selectedBook.url_pdf}</a>
                    </Typography>
                    <Typography variant="body1"><strong>Estado:</strong> {selectedBook.Estado_libro}</Typography>
                    <Typography variant="body1"><strong>Categorías:</strong> {selectedBook.categorias || 'N/A'}</Typography>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleAcquireBook} variant="contained" color="primary">
                  Adquirir Libro
                </Button>
                <Button onClick={handleCloseBook}>Cerrar</Button>
              </DialogActions>
            </Dialog>
          )}
        </>
      )}

      {pathname === '/mis-libros' && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>Mis Libros</Typography>
          <Grid container spacing={3} justifyContent="center">
            {userBooks.map((book) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={book.id_libro}>
                <BookCard 
                  image={book.url_portada} 
                  title={book.nombre_libro} 
                  author={book.autor} 
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}

DemoPageContent.propTypes = { pathname: PropTypes.string.isRequired };

function DashboardLayoutBranding(props) {
  const { window, isAdmin } = props;
  const router = useDemoRouter('/inicio');
  const demoWindow = window !== undefined ? window() : undefined;
  const navigation = isAdmin ? [
    ...NAVIGATION,
    { segment: 'administrar-libros', title: 'Administrar Libros', icon: <AddIcon /> },
  ] : NAVIGATION;

  return (
    <AppProvider
      navigation={navigation}
      branding={{
        logo: <img src="/banner_logo.png" alt="book logo" />,
        title: 'E-bookVault',
        homeUrl: '/toolpad/core/introduction',
      }}
      router={router}
      theme={demoTheme}
      window={demoWindow}
    >
      <DashboardLayout>
        {router.pathname === '/administrar-libros'
          ? <AdminBooks />
          : <DemoPageContent pathname={router.pathname} />
        }
      </DashboardLayout>
    </AppProvider>
  );
}

DashboardLayoutBranding.propTypes = { window: PropTypes.func };

export default DashboardLayoutBranding;