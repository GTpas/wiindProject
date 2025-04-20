import React from "react";
import { Box, Button, Typography, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/signin");
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <Container maxWidth="sm" style={{ textAlign: "center", marginTop: "100px" }}>
      <Typography variant="h4" gutterBottom>
        Bienvenue sur WIIND APP !
      </Typography>
      <Typography variant="body1" gutterBottom>
        Connectez-vous ou créez un compte pour commencer.
      </Typography>
      <Box mt={4}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSignIn}
          style={{ marginRight: "10px" }}
        >
          Se connecter
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleSignUp}
        >
          S'inscrire
        </Button>
      </Box>
    </Container>
  );
}
