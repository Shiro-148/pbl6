package com.example.backend.controller;

import com.example.backend.model.UserProfile;
import com.example.backend.repository.UserProfileRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final UserRepository userRepo;
    private final UserProfileRepository profileRepo;
    private final JwtUtil jwtUtil;

    public ProfileController(UserRepository userRepo, UserProfileRepository profileRepo, JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public ResponseEntity<?> get(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = (authHeader != null && authHeader.startsWith("Bearer ")) ? authHeader.substring(7) : null;
        String username = token != null ? jwtUtil.extractUsername(token) : null;
        if (username == null)
            return ResponseEntity.status(401).body("Unauthorized");
        return userRepo.findByUsername(username).map(u -> {
            UserProfile p = profileRepo.findByUserId(u.getId());
            if (p == null) {
                p = new UserProfile();
                p.setUser(u);
                p.setDisplayName(u.getUsername());
                p = profileRepo.save(p);
            }
            return ResponseEntity.ok(Map.of(
                    "displayName", p.getDisplayName(),
                    "email", u.getEmail(),
                    "avatarUrl", p.getAvatarUrl(),
                    "bio", p.getBio()));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> body) {
        String token = (authHeader != null && authHeader.startsWith("Bearer ")) ? authHeader.substring(7) : null;
        String username = token != null ? jwtUtil.extractUsername(token) : null;
        if (username == null)
            return ResponseEntity.status(401).body("Unauthorized");
        return userRepo.findByUsername(username).map(u -> {
            UserProfile p = profileRepo.findByUserId(u.getId());
            if (p == null) {
                p = new UserProfile();
                p.setUser(u);
            }
            if (body.containsKey("displayName"))
                p.setDisplayName(body.get("displayName"));
            if (body.containsKey("email"))
                u.setEmail(body.get("email"));
            if (body.containsKey("avatarUrl"))
                p.setAvatarUrl(body.get("avatarUrl"));
            if (body.containsKey("bio"))
                p.setBio(body.get("bio"));
            userRepo.save(u);
            profileRepo.save(p);
            return ResponseEntity.ok(Map.of("status", "ok"));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }
}
