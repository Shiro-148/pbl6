package com.example.backend.service;

import com.example.backend.model.Flashcard;
import com.example.backend.model.FlashcardSet;
import com.example.backend.repository.FlashcardRepository;
import com.example.backend.repository.FlashcardSetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FlashcardService {

    private final FlashcardRepository cardRepo;
    private final FlashcardSetRepository setRepo;

    public FlashcardService(FlashcardRepository cardRepo, FlashcardSetRepository setRepo) {
        this.cardRepo = cardRepo;
        this.setRepo = setRepo;
    }

    public List<Flashcard> findAllBySet(Long setId) {
        if (setId == null)
            return cardRepo.findAll();
        return setRepo.findById(setId).map(FlashcardSet::getCards).orElse(List.of());
    }

    public Flashcard findById(Long id) {
        return cardRepo.findById(id).orElse(null);
    }

    public Flashcard create(Long setId, Flashcard card) {
        FlashcardSet set = setRepo.findById(setId).orElse(null);
        if (set == null)
            return null;
        card.setSet(set);
        Flashcard saved = cardRepo.save(card);
        // ensure association
        set.getCards().add(saved);
        setRepo.save(set);
        return saved;
    }

    public Flashcard update(Long id, Flashcard updated) {
        return cardRepo.findById(id).map(existing -> {
            existing.setFront(updated.getFront());
            existing.setBack(updated.getBack());
            return cardRepo.save(existing);
        }).orElse(null);
    }

    public void delete(Long id) {
        cardRepo.deleteById(id);
    }
}