package com.example.backend.controller;

import com.example.backend.model.Folder;
import com.example.backend.service.FolderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderService service;

    public FolderController(FolderService service) {
        this.service = service;
    }

    @GetMapping
    public List<Folder> list() {
        return service.findAll();
    }

    @PostMapping
    public ResponseEntity<Folder> create(@RequestBody Folder f) {
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
