package com.example.backend.controller;

import com.example.backend.model.FlashcardStar;
import com.example.backend.repository.FlashcardRepository;
import com.example.backend.repository.FlashcardSetRepository;
import com.example.backend.repository.FlashcardStarRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final UserRepository userRepo;

    public StarController(FlashcardStarRepository starRepo, FlashcardSetRepository setRepo,
            FlashcardRepository cardRepo, UserRepository userRepo) {
        this.starRepo = starRepo;
        this.setRepo = setRepo;
        this.cardRepo = cardRepo;
        this.userRepo = userRepo;
    }

    @GetMapping("/api/sets/{setId}/stars")
    public Map<String, Object> listStars(@PathVariable Long setId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return Map.of("setId", setId, "cardIds", List.of(), "count", 0);
        }
        var userOpt = userRepo.findByUsername(auth.getName());
        if (userOpt.isEmpty()) {
            return Map.of("setId", setId, "cardIds", List.of(), "count", 0);
        }
        Long userId = userOpt.get().getId();

        List<Long> cardIds = starRepo.findBySetIdAndUserId(setId, userId).stream()
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
        // determine current user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        var userOpt = userRepo.findByUsername(auth.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Long userId = userOpt.get().getId();
        var existing = starRepo.findByCardIdAndUserId(cardId, userId);
        if (existing.isPresent()) {
            return ResponseEntity.ok(Map.of("starred", true));
        }
        FlashcardStar star = new FlashcardStar(setId, cardId, userId);
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        var userOpt = userRepo.findByUsername(auth.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Long userId = userOpt.get().getId();

        starRepo.deleteByCardIdAndUserId(cardId, userId);
        return ResponseEntity.ok(Map.of("starred", false));
    }
}
