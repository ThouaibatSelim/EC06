package com.example.auth_tp3;

import com.example.auth_tp3.entity.User;
import com.example.auth_tp3.exception.AuthenticationFailedException;
import com.example.auth_tp3.exception.InvalidInputException;
import com.example.auth_tp3.exception.ResourceConflictException;
import com.example.auth_tp3.repository.UserRepository;
import com.example.auth_tp3.service.AuthService;
import com.example.auth_tp3.service.EncryptionService;
import com.example.auth_tp3.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EncryptionService encryptionService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() throws Exception {
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPassword("encrypted_password");
        testUser.setNom("Dupont");
        testUser.setPrenom("Jean");
        testUser.setRole("apprenant");
    }

    // --- TESTS REGISTER ---

    @Test
    void register_succes() throws Exception {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(encryptionService.encrypt(any())).thenReturn("encrypted");
        when(userRepository.save(any())).thenReturn(testUser);

        User result = authService.register(
            "Dupont", "Jean", "test@example.com",
            "MotDePasse123!", "apprenant"
        );

        assertNotNull(result);
        verify(userRepository, times(1)).save(any());
    }

    @Test
    void register_emailDejaUtilise() {
        when(userRepository.existsByEmail(any())).thenReturn(true);

        assertThrows(ResourceConflictException.class, () ->
            authService.register(
                "Dupont", "Jean", "test@example.com",
                "MotDePasse123!", "apprenant"
            )
        );
    }

    @Test
    void register_emailInvalide() {
        assertThrows(InvalidInputException.class, () ->
            authService.register(
                "Dupont", "Jean", "emailsansarobase",
                "MotDePasse123!", "apprenant"
            )
        );
    }

    @Test
    void register_motDePasseTropCourt() {
        assertThrows(InvalidInputException.class, () ->
            authService.register(
                "Dupont", "Jean", "test@example.com",
                "court", "apprenant"
            )
        );
    }

    @Test
    void register_roleInvalide() {
        assertThrows(InvalidInputException.class, () ->
            authService.register(
                "Dupont", "Jean", "test@example.com",
                "MotDePasse123!", "admin"
            )
        );
    }

    // --- TESTS LOGIN ---

    @Test
    void login_succes() throws Exception {
        when(userRepository.findByEmail("test@example.com"))
            .thenReturn(Optional.of(testUser));
        when(encryptionService.decrypt("encrypted_password"))
            .thenReturn("MotDePasse123!");
        when(jwtService.generateToken(testUser))
            .thenReturn("fake_jwt_token");

        String token = authService.login("test@example.com", "MotDePasse123!");

        assertEquals("fake_jwt_token", token);
    }

    @Test
    void login_emailInexistant() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThrows(AuthenticationFailedException.class, () ->
            authService.login("inconnu@example.com", "MotDePasse123!")
        );
    }

    @Test
    void login_mauvaisMotDePasse() throws Exception {
        when(userRepository.findByEmail("test@example.com"))
            .thenReturn(Optional.of(testUser));
        when(encryptionService.decrypt("encrypted_password"))
            .thenReturn("MotDePasse123!");

        assertThrows(AuthenticationFailedException.class, () ->
            authService.login("test@example.com", "MauvaisMotDePasse!")
        );
    }
}