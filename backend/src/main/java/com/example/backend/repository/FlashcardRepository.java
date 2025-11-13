package com.example.backend.repository;

import com.example.backend.model.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findBySetId(Long setId);
    long countBySetId(Long setId);
}
