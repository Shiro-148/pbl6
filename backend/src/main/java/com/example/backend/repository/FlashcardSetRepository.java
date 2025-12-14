package com.example.backend.repository;

import com.example.backend.model.FlashcardSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardSetRepository extends JpaRepository<FlashcardSet, Long> {
    List<FlashcardSet> findByFolderId(Long folderId);

    List<FlashcardSet> findByAccess(String access);

    Page<FlashcardSet> findByAccess(String access, Pageable pageable);
}
