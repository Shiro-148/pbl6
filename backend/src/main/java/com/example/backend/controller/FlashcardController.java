package com.example.backend.controller;

import com.example.backend.dto.FlashcardDto;
import com.example.backend.model.Flashcard;
import com.example.backend.service.FlashcardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
public class FlashcardController {

    private final FlashcardService service;

    public FlashcardController(FlashcardService service) {
        this.service = service;
    }

    @GetMapping("/api/sets/{setId}/cards")
    public List<FlashcardDto> listBySet(@PathVariable Long setId) {
        return service.findAllBySet(setId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @PostMapping("/api/sets/{setId}/cards")
    public ResponseEntity<FlashcardDto> create(@PathVariable Long setId, @RequestBody FlashcardDto dto) {
        Flashcard card = fromDto(dto);
        Flashcard created = service.create(setId, card);
        if (created == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.created(URI.create("/api/cards/" + created.getId())).body(toDto(created));
    }

    @GetMapping("/api/cards/{id}")
    public ResponseEntity<FlashcardDto> get(@PathVariable Long id) {
        Flashcard card = service.findById(id);
        if (card == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toDto(card));
    }

    @PutMapping("/api/cards/{id}")
    public ResponseEntity<FlashcardDto> update(@PathVariable Long id, @RequestBody FlashcardDto dto) {
        Flashcard updated = fromDto(dto);
        Flashcard res = service.update(id, updated);
        if (res == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toDto(res));
    }

    @DeleteMapping("/api/cards/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private FlashcardDto toDto(Flashcard f) {
        FlashcardDto d = new FlashcardDto();
        d.setId(f.getId());
        d.setWord(f.getWord());
        d.setDefinition(f.getDefinition());
        d.setPhonetic(f.getPhonetic());
        d.setExample(f.getExample());
        d.setType(f.getType());
        d.setAudio(f.getAudio());
        if (f.getSet() != null)
            d.setSetId(f.getSet().getId());
        return d;
    }

    private Flashcard fromDto(FlashcardDto d) {
        Flashcard f = new Flashcard();
        f.setWord(d.getWord());
        f.setDefinition(d.getDefinition());
        f.setPhonetic(d.getPhonetic());
        f.setExample(d.getExample());
        f.setType(d.getType());
        f.setAudio(d.getAudio());
        return f;
    }
}