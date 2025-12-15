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
import com.example.backend.repository.UserProfileRepository;
import com.example.backend.service.FlashcardSetService;
import com.example.backend.service.FolderService;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private final UserProfileRepository userProfileRepository;

    public SetController(FlashcardSetService service, FlashcardRepository flashcardRepository,
            UserRepository userRepository, FolderService folderService, UserProfileRepository userProfileRepository) {
        this.service = service;
        this.flashcardRepository = flashcardRepository;
        this.userRepository = userRepository;
        this.folderService = folderService;
        this.userProfileRepository = userProfileRepository;
    }

    @GetMapping
    public List<SetDto> list(@RequestParam(required = false) Long folderId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        List<FlashcardSet> sets;
        if (folderId != null) {
            Folder folder = folderService.findById(folderId);
            if (folder == null || !folder.getUser().getId().equals(currentUser.getId())) {
                throw new ResourceNotFoundException("Folder not found or access denied: " + folderId);
            }
            sets = service.findByFolderId(folderId);
        } else {
            List<Folder> userFolders = folderService.findByUser(currentUser);
            List<Long> folderIds = userFolders.stream().map(Folder::getId).collect(Collectors.toList());

            sets = service.findAll().stream()
                    .filter(set -> set.getFolder() != null && folderIds.contains(set.getFolder().getId()))
                    .collect(Collectors.toList());
        }
        return sets.stream().map(this::toDto).toList();
    }

    @GetMapping("/public")
    public ResponseEntity<?> listPublic(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String order) {
        Sort sort = Sort.unsorted();
        if ("desc".equalsIgnoreCase(order)) {
            sort = Sort.by(sortBy != null && !sortBy.isBlank() ? sortBy : "id").descending();
        } else {
            sort = Sort.by(sortBy != null && !sortBy.isBlank() ? sortBy : "id").ascending();
        }
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), sort);
        Page<FlashcardSet> setsPage = service.findPublic(pageable);
        var content = setsPage.getContent().stream().map(this::toDto).toList();
        var body = new java.util.HashMap<String, Object>();
        body.put("content", content);
        body.put("page", setsPage.getNumber());
        body.put("size", setsPage.getSize());
        body.put("totalElements", setsPage.getTotalElements());
        body.put("totalPages", setsPage.getTotalPages());
        return ResponseEntity.ok(body);
    }

    @PostMapping
    public ResponseEntity<SetDto> create(@RequestBody CreateSetRequest req) {
        FlashcardSet set = new FlashcardSet();
        set.setTitle(req.getTitle());
        set.setDescription(req.getDescription());
        if (req.getAccess() != null && !req.getAccess().isBlank()) {
            set.setAccess(req.getAccess());
        }
        if (req.getFolderId() != null) {
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
        if (req.getAccess() != null && !req.getAccess().isBlank()) {
            updated.setAccess(req.getAccess());
        }
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
        d.setAccess(s.getAccess());
        if (s.getFolder() != null)
            d.setFolderId(s.getFolder().getId());

        if (s.getFolder() != null && s.getFolder().getUser() != null) {
            var owner = s.getFolder().getUser();
            d.setOwnerUsername(owner.getUsername());
            var profile = userProfileRepository.findByUserId(owner.getId());
            if (profile != null) {
                d.setOwnerDisplayName(profile.getDisplayName());
                d.setOwnerAvatarUrl(profile.getAvatarUrl());
            }
        }

        long cardCount = flashcardRepository.countBySetId(s.getId());
        d.setCardCount((int) cardCount);

        List<Flashcard> cards = flashcardRepository.findBySetId(s.getId());
        if (cards != null && !cards.isEmpty()) {
            d.setCards(cards.stream().map(this::cardToDto).toList());
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
