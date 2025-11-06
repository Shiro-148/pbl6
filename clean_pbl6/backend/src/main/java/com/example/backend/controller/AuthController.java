package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.model.UserProfile;
import com.example.backend.repository.UserProfileRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final UserProfileRepository profileRepo;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(UserRepository userRepo, UserProfileRepository profileRepo, JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null)
            return ResponseEntity.badRequest().build();
        if (userRepo.findByUsername(username).isPresent())
            return ResponseEntity.status(409).body("User exists");
        User u = new User();
        u.setUsername(username);
        u.setPassword(encoder.encode(password));
        User saved = userRepo.save(u);

        // optional profile fields
        String displayName = body.get("displayName");
        String email = body.get("email");
        if ((displayName != null && !displayName.isBlank()) || (email != null && !email.isBlank())) {
            UserProfile p = new UserProfile();
            p.setUser(saved);
            p.setDisplayName(displayName);
            p.setEmail(email);
            profileRepo.save(p);
        }

        return ResponseEntity.ok(Map.of("username", username));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null)
            return ResponseEntity.badRequest().build();
        return userRepo.findByUsername(username)
                .map(u -> {
                    if (encoder.matches(password, u.getPassword())) {
                        String token = jwtUtil.generateToken(username);
                        return ResponseEntity.ok(Map.of("token", token));
                    }
                    return ResponseEntity.status(401).body("Invalid credentials");
                }).orElse(ResponseEntity.status(401).body("Invalid credentials"));
    }
}
