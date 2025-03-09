import { 
  Container, Grid, Paper, TextField, Button, Typography, IconButton, InputAdornment 
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { use, useState } from "react";
import { useNavigate } from "react-router-dom";

function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState("");           // NEW: para "Nombres"
  const [apellido, setApellido] = useState("");         // NEW: para "Apellidos"
  const [selectedFile, setSelectedFile] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if(isRegister) {
      // En modo registro se arma un FormData para enviar los datos del usuario
      const formData = new FormData();
      formData.append("p_nombre", nombre);
      formData.append("p_apellido", apellido);
      formData.append("p_url_foto_perfil", selectedFile || ""); 
      formData.append("p_correo", email);
      formData.append("p_contrasenia", password);
    
      try {
        
        const response = await fetch("http://backend-1289678215.us-east-1.elb.amazonaws.com/user/signup", {
          method: "POST",
          body: formData
        });
        if (!response.ok) {
          alert("Error en registro");
          return;
        }else{
          window.alert("Usuario registrado con éxito");
        }
      } catch (error) {
        alert("Error en registro");
      }
    } else {
      
      try {
        const response = await fetch("http://backend-1289678215.us-east-1.elb.amazonaws.com/user/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password })
        });
        if (response.status !== 200) {
          alert("Error en la petición de login1", response.error);
          return;
        }
      
        const user = await response.json();
        console.log(user.p_correo);
        localStorage.setItem("user", JSON.stringify(user));
        if (user.p_correo === "admin") {
          navigate("/admin");
        } else if (user) {
          navigate("/main");
        } else {
          alert("Credenciales incorrectas");
        }
      } catch (error) {
        alert("Error en la petición de login2",error);
      }
    }
  };

  return (
    <Container 
      maxWidth="md" 
      style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1c1c1c" }}
    >
      <Grid container component={Paper} elevation={3} style={{ backgroundColor: "#2c2c2c", color: "#ffffff", maxHeight: "90vh", overflowY: "auto" }}>
        <Grid 
          item xs={6} 
          style={{ 
            backgroundImage: "url('/books.jpg')", 
            backgroundSize: "cover", 
            backgroundPosition: "center"
          }}
        />
        <Grid item xs={6} style={{ padding: "2rem", backgroundColor: "#333", color: "#fff" }}>
          <Typography variant="h4" align="center" gutterBottom>
            {isRegister ? "Registro" : "Iniciar Sesión"}
          </Typography>
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <TextField 
                  fullWidth 
                  label="Nombres" 
                  margin="normal" 
                  required 
                  InputLabelProps={{ style: { color: '#fff' } }} 
                  sx={{ input: { color: '#fff' } }}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                <TextField 
                  fullWidth 
                  label="Apellidos" 
                  margin="normal" 
                  required 
                  InputLabelProps={{ style: { color: '#fff' } }} 
                  sx={{ input: { color: '#fff' } }}
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </>
            )}
            <TextField 
              fullWidth 
              label="Correo Electrónico" 
              margin="normal" 
              required 
              InputLabelProps={{ style: { color: '#fff' } }} 
              sx={{ input: { color: '#fff' } }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField 
              fullWidth 
              label="Contraseña" 
              type={showPassword ? "text" : "password"} 
              margin="normal" 
              required 
              InputLabelProps={{ style: { color: '#fff' } }} 
              sx={{ input: { color: '#fff' } }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff style={{ color: "#fff" }} /> : <Visibility style={{ color: "#fff" }} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {isRegister && (
              <TextField 
                fullWidth 
                label="Confirmar Contraseña" 
                type={showPassword ? "text" : "password"} 
                margin="normal" 
                required 
                InputLabelProps={{ style: { color: '#fff' } }} 
                sx={{ input: { color: '#fff' } }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff style={{ color: "#fff" }} /> : <Visibility style={{ color: "#fff" }} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            )}
            {isRegister && (
              <>
                <Button
                  variant="contained"
                  component="label"
                  fullWidth
                  style={{ marginTop: "1rem", backgroundColor: "#555" }}
                >
                  Subir Foto de Perfil
                  <input type="file" hidden onChange={handleFileChange} />
                </Button>
                {selectedFile && (
                  <Typography variant="body2" align="center" style={{ marginTop: "0.5rem" }}>
                    {selectedFile.name}
                  </Typography>
                )}
              </>
            )}
            <Button type="submit" fullWidth variant="contained" style={{ marginTop: "1rem", backgroundColor: "#555" }}>
              {isRegister ? "Registrarse" : "Ingresar"}
            </Button>
          </form>
          <Typography 
            variant="body2" 
            align="center" 
            style={{ marginTop: "1rem", cursor: "pointer" }} 
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
          </Typography>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AuthPage;
