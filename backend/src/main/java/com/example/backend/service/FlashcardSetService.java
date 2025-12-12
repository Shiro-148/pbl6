package com.example.backend.service;

import com.example.backend.model.FlashcardSet;
import com.example.backend.repository.FlashcardSetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FlashcardSetService {

    private final FlashcardSetRepository repo;

    public FlashcardSetService(FlashcardSetRepository repo) {
        this.repo = repo;
    }

    public List<FlashcardSet> findAll() {
        return repo.findAll();
    }

    public List<FlashcardSet> findByFolderId(Long folderId) {
        return repo.findByFolderId(folderId);
    }

    public List<FlashcardSet> findPublic() {
        return repo.findByAccess("public");
    }

    public FlashcardSet findById(Long id) {
        return repo.findById(id).orElse(null);
    }

    public FlashcardSet create(FlashcardSet set) {
        return repo.save(set);
    }

    public FlashcardSet update(Long id, FlashcardSet updated) {
        return repo.findById(id).map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setDescription(updated.getDescription());
            if (updated.getAccess() != null)
                existing.setAccess(updated.getAccess());
            if (updated.getFolder() != null)
                existing.setFolder(updated.getFolder());
            return repo.save(existing);
        }).orElse(null);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}
