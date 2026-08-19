package com.example.auth_tp3;

import com.example.auth_tp3.service.AuthService;
import com.example.auth_tp3.service.JwtService;
import com.example.auth_tp3.repository.UserRepository;
import com.example.auth_tp3.entity.User;
import com.example.auth_tp3.exception.ResourceConflictException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.example.auth_tp3.controller.AuthController;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// ─────────────────────────────────────────────────────────────────
// @WebMvcTest ne charge que la couche web (controllers) — toutes
// les dépendances injectées dans AuthController doivent être
// mockées ici, sinon Spring ne peut pas instancier le contrôleur
// (AuthController a besoin de AuthService, UserRepository et
// JwtService dans son constructeur)
// ─────────────────────────────────────────────────────────────────
@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtService jwtService;

    @Test
    void register_retourne201() throws Exception {
        User user = new User();
        user.setEmail("test@example.com");
        user.setNom("Dupont");
        user.setPrenom("Jean");
        user.setRole("apprenant");

        when(authService.register(any(), any(), any(), any(), any()))
            .thenReturn(user);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "nom": "Dupont",
                        "prenom": "Jean",
                        "email": "test@example.com",
                        "password": "MotDePasse123!",
                        "role": "apprenant"
                    }
                    """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Inscription réussie"));
    }

    @Test
    void login_retourne200AvecToken() throws Exception {
        when(authService.login(any(), any()))
            .thenReturn("fake_jwt_token");

        // AuthController.login() recharge l'utilisateur via
        // userRepository.findByEmail() après authService.login()
        // pour construire la réponse — doit être mocké aussi
        User user = new User();
        user.setEmail("test@example.com");
        user.setNom("Dupont");
        user.setPrenom("Jean");
        user.setRole("apprenant");

        when(userRepository.findByEmail(any()))
            .thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "email": "test@example.com",
                        "password": "MotDePasse123!"
                    }
                    """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("fake_jwt_token"));
    }

    @Test
    void register_emailDejaUtilise_retourne409() throws Exception {
        when(authService.register(any(), any(), any(), any(), any()))
            .thenThrow(new ResourceConflictException("Email déjà utilisé"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "nom": "Dupont",
                        "prenom": "Jean",
                        "email": "test@example.com",
                        "password": "MotDePasse123!",
                        "role": "apprenant"
                    }
                    """))
                .andExpect(status().isConflict());
    }
}