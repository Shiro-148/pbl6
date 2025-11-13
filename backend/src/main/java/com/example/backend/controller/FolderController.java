package com.example.backend.controller;

import com.example.backend.model.Folder;
import com.example.backend.service.FolderService;
import com.example.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderService service;
    private final UserRepository userRepo;

    public FolderController(FolderService service, UserRepository userRepo) {
        this.service = service;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<Folder> list() {
        return service.findAll();
    }

    @PostMapping
    public ResponseEntity<Folder> create(@RequestBody Folder f) {
        // Always assign folder to authenticated user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null
                || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(401).build();
        }
        userRepo.findByUsername(auth.getName()).ifPresent(f::setUser);

        Folder created = service.create(f);
        return ResponseEntity.created(URI.create("/api/folders/" + created.getId())).body(created);
    }

    @GetMapping("/{id}")
    public Folder get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public Folder update(@PathVariable Long id, @RequestBody Folder f) {
        return service.update(id, f);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}