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
        String email = body.get("email");
        String password = body.get("password");
        if (username == null || email == null || password == null)
            return ResponseEntity.badRequest().build();
        if (userRepo.findByUsername(username).isPresent())
            return ResponseEntity.status(409).body("User exists");
        if (userRepo.findByEmail(email).isPresent())
            return ResponseEntity.status(409).body("Email exists");
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword(encoder.encode(password));
        User saved = userRepo.save(u);

        // optional profile fields
        String displayName = body.get("displayName");
        if ((displayName != null && !displayName.isBlank())) {
            UserProfile p = new UserProfile();
            p.setUser(saved);
            p.setDisplayName(displayName);
            profileRepo.save(p);
        }

        return ResponseEntity.ok(Map.of("username", username));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String identifier = body.get("username");
        String password = body.get("password");
        if (identifier == null || password == null)
            return ResponseEntity.badRequest().build();
        // allow login by username or email
        User u = userRepo.findByUsername(identifier).orElseGet(() -> userRepo.findByEmail(identifier).orElse(null));
        if (u != null) {
            if (encoder.matches(password, u.getPassword())) {
                String token = jwtUtil.generateToken(u.getUsername());
                return ResponseEntity.ok(Map.of("token", token));
            }
            return ResponseEntity.status(401).body("Invalid credentials");
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        String oldPass = body.get("oldPassword");
        String newPass = body.get("newPassword");
        if (oldPass == null || newPass == null)
            return ResponseEntity.badRequest().body("Missing fields");
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        String username = token != null ? jwtUtil.extractUsername(token) : null;
        if (username == null)
            return ResponseEntity.status(401).body("Unauthorized");
        return userRepo.findByUsername(username).map(u -> {
            if (!this.encoder.matches(oldPass, u.getPassword())) {
                return ResponseEntity.status(400).body("Old password incorrect");
            }
            u.setPassword(this.encoder.encode(newPass));
            userRepo.save(u);
            return ResponseEntity.ok(Map.of("status", "ok"));
        }).orElse(ResponseEntity.status(404).body("User not found"));
    }
}
