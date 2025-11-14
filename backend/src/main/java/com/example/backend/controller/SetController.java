package com.example.backend.controller;

import com.example.backend.dto.CreateSetRequest;
import com.example.backend.dto.FlashcardDto;
import com.example.backend.dto.SetDto;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.Flashcard;
import com.example.backend.model.FlashcardSet;
import com.example.backend.model.Folder;
import com.example.backend.model.User;
import com.example.backend.repository.FlashcardRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.FlashcardSetService;
import com.example.backend.service.FolderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sets")
public class SetController {

    private final FlashcardSetService service;
    private final FlashcardRepository flashcardRepository;
    private final UserRepository userRepository;
    private final FolderService folderService;

    public SetController(FlashcardSetService service, FlashcardRepository flashcardRepository,
                        UserRepository userRepository, FolderService folderService) {
        this.service = service;
        this.flashcardRepository = flashcardRepository;
        this.userRepository = userRepository;
        this.folderService = folderService;
    }

    @GetMapping
    public List<SetDto> list(@RequestParam(required = false) Long folderId) {
        // Lấy user hiện tại từ JWT
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        
        List<FlashcardSet> sets;
        if (folderId != null) {
            // Kiểm tra folder có thuộc về user hiện tại không
            Folder folder = folderService.findById(folderId);
            if (folder == null || !folder.getUser().getId().equals(currentUser.getId())) {
                throw new ResourceNotFoundException("Folder not found or access denied: " + folderId);
            }
            sets = service.findByFolderId(folderId);
        } else {
            // Lấy tất cả folders của user
            List<Folder> userFolders = folderService.findByUser(currentUser);
            List<Long> folderIds = userFolders.stream().map(Folder::getId).collect(Collectors.toList());
            
            // Lấy tất cả sets thuộc các folders của user
            sets = service.findAll().stream()
                    .filter(set -> set.getFolder() != null && folderIds.contains(set.getFolder().getId()))
                    .collect(Collectors.toList());
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
