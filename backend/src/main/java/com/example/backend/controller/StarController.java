package com.example.backend.controller;

import com.example.backend.model.FlashcardStar;
import com.example.backend.repository.FlashcardRepository;
import com.example.backend.repository.FlashcardSetRepository;
import com.example.backend.repository.FlashcardStarRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@RestController
public class StarController {

    private final FlashcardStarRepository starRepo;
    private final FlashcardSetRepository setRepo;
    private final FlashcardRepository cardRepo;

    public StarController(FlashcardStarRepository starRepo, FlashcardSetRepository setRepo,
            FlashcardRepository cardRepo) {
        this.starRepo = starRepo;
        this.setRepo = setRepo;
        this.cardRepo = cardRepo;
    }

    @GetMapping("/api/sets/{setId}/stars")
    public Map<String, Object> listStars(@PathVariable Long setId) {
        List<Long> cardIds = starRepo.findBySetId(setId).stream()
                .map(FlashcardStar::getCardId)
                .collect(Collectors.toList());
        return Map.of("setId", setId, "cardIds", cardIds, "count", cardIds.size());
    }

    @Transactional
    @PostMapping("/api/sets/{setId}/cards/{cardId}/star")
    public ResponseEntity<Map<String, Object>> star(@PathVariable Long setId, @PathVariable Long cardId) {
        var set = setRepo.findById(setId);
        var card = cardRepo.findById(cardId);
        if (set.isEmpty() || card.isEmpty())
            return ResponseEntity.notFound().build();
        var existing = starRepo.findBySetIdAndCardId(setId, cardId);
        if (existing.isPresent()) {
            return ResponseEntity.ok(Map.of("starred", true));
        }
        FlashcardStar star = new FlashcardStar(setId, cardId, null);
        starRepo.save(star);
        return ResponseEntity.ok(Map.of("starred", true));
    }

    @Transactional
    @DeleteMapping("/api/sets/{setId}/cards/{cardId}/star")
    public ResponseEntity<Map<String, Object>> unstar(@PathVariable Long setId, @PathVariable Long cardId) {
        var set = setRepo.findById(setId);
        var card = cardRepo.findById(cardId);
        if (set.isEmpty() || card.isEmpty())
            return ResponseEntity.notFound().build();
        starRepo.deleteBySetIdAndCardId(setId, cardId);
        return ResponseEntity.ok(Map.of("starred", false));
    }
}
