package com.example.backend.service;

import com.example.backend.model.Folder;
import com.example.backend.model.User;
import com.example.backend.repository.FolderRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FolderService {
    private final FolderRepository repo;

    public FolderService(FolderRepository repo) {
        this.repo = repo;
    }

    public List<Folder> findAll() {
        return repo.findAll();
    }

    public List<Folder> findByUser(User user) {
        return repo.findByUser(user);
    }

    public List<Folder> findByUserId(Long userId) {
        return repo.findByUserId(userId);
    }

    public Folder findById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public Folder create(Folder f) {
        return repo.save(f);
    }

    public Folder update(Long id, Folder updated) {
        return repo.findById(id).map(existing -> {
            existing.setName(updated.getName());
            return repo.save(existing);
        }).orElse(null);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}