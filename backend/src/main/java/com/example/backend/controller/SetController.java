package com.example.backend.controller;

import com.example.backend.dto.CreateSetRequest;
import com.example.backend.dto.FlashcardDto;
import com.example.backend.dto.SetDto;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.Flashcard;
import com.example.backend.model.FlashcardSet;
import com.example.backend.model.Folder;
import com.example.backend.repository.FlashcardRepository;
import com.example.backend.service.FlashcardSetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/sets")
public class SetController {

    private final FlashcardSetService service;
    private final FlashcardRepository flashcardRepository;

    public SetController(FlashcardSetService service, FlashcardRepository flashcardRepository) {
        this.service = service;
        this.flashcardRepository = flashcardRepository;
    }

    @GetMapping
    public List<SetDto> list(@RequestParam(required = false) Long folderId) {
        List<FlashcardSet> sets;
        if (folderId != null) {
            sets = service.findByFolderId(folderId);
        } else {
            sets = service.findAll();
        }
        return sets.stream().map(this::toDto).toList();
    }

    @PostMapping
    public ResponseEntity<SetDto> create(@RequestBody CreateSetRequest req) {
        FlashcardSet set = new FlashcardSet();
        set.setTitle(req.getTitle());
        set.setDescription(req.getDescription());
        if (req.getFolderId() != null) {
            // avoid direct repo access here; lazy assign a Folder with id to reference
            Folder folder = new Folder();
            folder.setId(req.getFolderId());
            set.setFolder(folder);
        }
        FlashcardSet created = service.create(set);
        return ResponseEntity.created(URI.create("/api/sets/" + created.getId())).body(toDto(created));
    }

    @GetMapping("/{id}")
    public SetDto get(@PathVariable Long id) {
        FlashcardSet set = service.findById(id);
        if (set == null)
            throw new ResourceNotFoundException("Set not found: " + id);
        return toDto(set);
    }

    @PutMapping("/{id}")
    public SetDto update(@PathVariable Long id, @RequestBody CreateSetRequest req) {
        FlashcardSet updated = new FlashcardSet();
        updated.setTitle(req.getTitle());
        updated.setDescription(req.getDescription());
        if (req.getFolderId() != null) {
            Folder folder = new Folder();
            folder.setId(req.getFolderId());
            updated.setFolder(folder);
        }
        FlashcardSet res = service.update(id, updated);
        if (res == null)
            throw new ResourceNotFoundException("Set not found: " + id);
        return toDto(res);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private SetDto toDto(FlashcardSet s) {
        SetDto d = new SetDto();
        d.setId(s.getId());
        d.setTitle(s.getTitle());
        d.setDescription(s.getDescription());
        if (s.getFolder() != null)
            d.setFolderId(s.getFolder().getId());
        
        // Count cards using repository to avoid lazy loading issues
        long cardCount = flashcardRepository.countBySetId(s.getId());
        d.setCardCount((int) cardCount);
        
        // Only load full cards if needed
        if (s.getCards() != null && !s.getCards().isEmpty()) {
            d.setCards(s.getCards().stream().map(this::cardToDto).toList());
        }
        
        return d;
    }

    private FlashcardDto cardToDto(Flashcard f) {
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
}
